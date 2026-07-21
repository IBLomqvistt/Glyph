import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'
import Fastify, { type FastifyInstance } from 'fastify'
import { ZodError } from 'zod'

import {
  ApplicationError,
  DeferredConnectorTester,
  DeferredStageExecutor,
  EditorialService,
  PipelineService,
  MapConnectorRegistry,
  PaperLabelOntologyService,
  RuntimePublicationService,
  RuntimeWorkflowService,
  SourceTrackerService,
  SourceRegistryService,
  type RuntimeAgentSuite,
  type RuntimeRepository,
  type SourceConnectorRegistry,
} from '@glyph/application'
import {
  PaperSchema,
  PaperVersionSchema,
  PipelineStageSchema,
  type PublicationInput,
} from '@glyph/domain'
import {
  MarketContextInputSchema,
  PaperLabelOntologySchema,
} from '@glyph/domain/runtime-agents'
import {
  OpenAiRuntimeAgentSuite,
  StructuredOpenAiClient,
  runtimeAgentDefinitions,
} from '@glyph/openai'

import { requireEditor } from './auth.js'
import type { ApiConfig } from './config.js'

const IdParams = Type.Object({ id: Type.String({ minLength: 1 }) })
const SourceCreateBody = Type.Object({
  name: Type.String({ minLength: 1 }),
  kind: Type.Union([
    Type.Literal('LAB'),
    Type.Literal('AUTHOR'),
    Type.Literal('REPOSITORY'),
    Type.Literal('FEED'),
    Type.Literal('ECONOMIC_DATA'),
  ]),
  baseUrl: Type.String({ format: 'uri' }),
  enabled: Type.Boolean(),
  priority: Type.Integer({ minimum: 1, maximum: 100 }),
  rights: Type.Union([
    Type.Literal('PUBLIC_REUSE_ALLOWED'),
    Type.Literal('METADATA_ONLY'),
    Type.Literal('EXTERNAL_LINK_ONLY'),
    Type.Literal('PROHIBITED'),
  ]),
  connectorKey: Type.String({ minLength: 1 }),
  editorialNotes: Type.Union([Type.String({ minLength: 1 }), Type.Null()]),
})
const ErrorResponse = Type.Object({
  error: Type.Object({
    code: Type.String(),
    message: Type.String(),
    requestId: Type.String(),
    details: Type.Optional(Type.Unknown()),
  }),
})

export type AppDependencies = {
  config: ApiConfig
  repository: RuntimeRepository
  runtimeAgents?: RuntimeAgentSuite
  connectors?: SourceConnectorRegistry
}

export async function buildApp(
  dependencies: AppDependencies,
): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      dependencies.config.LOG_LEVEL === 'silent'
        ? false
        : {
            level: dependencies.config.LOG_LEVEL,
            redact: ['req.headers.authorization', 'req.headers.cookie'],
          },
    requestIdHeader: 'x-request-id',
  }).withTypeProvider<TypeBoxTypeProvider>()

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Glyph Backend API',
        description:
          'Evidence-first paper intelligence and editorial workflow API',
        version: '0.1.0',
      },
    },
  })
  await app.register(swaggerUi, { routePrefix: '/docs' })

  const sourceService = new SourceRegistryService(
    dependencies.repository,
    new DeferredConnectorTester(),
  )
  const pipelineService = new PipelineService(
    dependencies.repository,
    new DeferredStageExecutor(),
  )
  const editorialService = new EditorialService(dependencies.repository)
  const sourceTracker = new SourceTrackerService(
    dependencies.repository,
    dependencies.connectors ?? new MapConnectorRegistry(new Map()),
  )
  const ontologyService = new PaperLabelOntologyService(dependencies.repository)
  const runtimeAgents =
    dependencies.runtimeAgents ??
    (dependencies.config.OPENAI_API_KEY === undefined
      ? null
      : new OpenAiRuntimeAgentSuite(
          new StructuredOpenAiClient({
            apiKey: dependencies.config.OPENAI_API_KEY,
            model: dependencies.config.OPENAI_MODEL,
          }),
        ))
  const workflowService =
    runtimeAgents === null
      ? null
      : new RuntimeWorkflowService(dependencies.repository, runtimeAgents)
  const runtimePublication = new RuntimePublicationService(
    dependencies.repository,
  )

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ApplicationError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          requestId: request.id,
          ...(error.details === undefined ? {} : { details: error.details }),
        },
      })
    }
    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request failed domain validation',
          requestId: request.id,
          details: error.issues,
        },
      })
    }
    if (typeof error === 'object' && error !== null && 'validation' in error) {
      const validationError = error as {
        message?: string
        validation?: unknown
      }
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message:
            validationError.message ?? 'Request schema validation failed',
          requestId: request.id,
          details: validationError.validation,
        },
      })
    }
    request.log.error({ err: error }, 'Unhandled request error')
    return reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        requestId: request.id,
      },
    })
  })

  app.get('/health/live', {
    schema: {
      tags: ['health'],
      response: { 200: Type.Object({ status: Type.Literal('ok') }) },
    },
    handler: () => ({ status: 'ok' as const }),
  })
  app.get('/health/ready', {
    schema: {
      tags: ['health'],
      response: {
        200: Type.Object({ status: Type.Literal('ready') }),
        503: ErrorResponse,
      },
    },
    handler: async (_request, reply) => {
      try {
        await dependencies.repository.healthCheck()
        return { status: 'ready' as const }
      } catch {
        return reply.status(503).send({
          error: {
            code: 'DEPENDENCY_UNAVAILABLE',
            message: 'Persistence dependency is unavailable',
            requestId: reply.request.id,
          },
        })
      }
    },
  })

  app.get('/v1/sources', {
    schema: {
      tags: ['sources'],
      response: { 200: Type.Object({ data: Type.Array(Type.Unknown()) }) },
    },
    handler: async () => ({ data: await sourceService.list() }),
  })
  app.post('/v1/sources', {
    schema: {
      tags: ['sources'],
      body: SourceCreateBody,
      response: {
        201: Type.Object({ data: Type.Unknown() }),
        400: ErrorResponse,
        401: ErrorResponse,
        409: ErrorResponse,
      },
    },
    handler: async (request, reply) => {
      const identity = requireEditor(
        request,
        dependencies.config.GLYPH_EDITOR_TOKEN,
      )
      const source = await sourceService.create(request.body, identity.actorId)
      return reply.status(201).send({ data: source })
    },
  })
  app.patch('/v1/sources/:id/enabled', {
    schema: {
      tags: ['sources'],
      params: IdParams,
      body: Type.Object({ enabled: Type.Boolean() }),
      response: {
        200: Type.Object({ data: Type.Unknown() }),
        401: ErrorResponse,
        404: ErrorResponse,
      },
    },
    handler: async (request) => {
      const identity = requireEditor(
        request,
        dependencies.config.GLYPH_EDITOR_TOKEN,
      )
      return {
        data: await sourceService.setEnabled(
          request.params.id,
          request.body.enabled,
          identity.actorId,
        ),
      }
    },
  })
  app.post('/v1/sources/:id/test', {
    schema: {
      tags: ['sources'],
      params: IdParams,
      response: {
        200: Type.Object({ data: Type.Unknown() }),
        401: ErrorResponse,
        404: ErrorResponse,
      },
    },
    handler: async (request) => {
      const identity = requireEditor(
        request,
        dependencies.config.GLYPH_EDITOR_TOKEN,
      )
      return {
        data: await sourceService.test(request.params.id, identity.actorId),
      }
    },
  })
  app.get('/v1/sources/:id/audit', {
    schema: {
      tags: ['sources'],
      params: IdParams,
      response: { 200: Type.Object({ data: Type.Array(Type.Unknown()) }) },
    },
    handler: async (request) => ({
      data: await sourceService.audit(request.params.id),
    }),
  })

  app.post('/v1/papers', {
    schema: {
      tags: ['papers'],
      body: Type.Unknown(),
      response: {
        201: Type.Object({ data: Type.Unknown() }),
        400: ErrorResponse,
        401: ErrorResponse,
      },
    },
    handler: async (request, reply) => {
      requireEditor(request, dependencies.config.GLYPH_EDITOR_TOKEN)
      const paper = PaperSchema.parse(request.body)
      await dependencies.repository.savePaper(paper)
      return reply.status(201).send({ data: paper })
    },
  })
  app.get('/v1/papers/:id', {
    schema: {
      tags: ['papers'],
      params: IdParams,
      response: {
        200: Type.Object({ data: Type.Unknown() }),
        404: ErrorResponse,
      },
    },
    handler: async (request) => {
      const paper = await dependencies.repository.getPaper(request.params.id)
      if (paper === null) {
        throw new ApplicationError('PAPER_NOT_FOUND', 'Paper not found', 404)
      }
      return { data: paper }
    },
  })
  app.post('/v1/paper-versions', {
    schema: {
      tags: ['papers'],
      body: Type.Unknown(),
      response: {
        201: Type.Object({ data: Type.Unknown() }),
        400: ErrorResponse,
        401: ErrorResponse,
      },
    },
    handler: async (request, reply) => {
      requireEditor(request, dependencies.config.GLYPH_EDITOR_TOKEN)
      const version = PaperVersionSchema.parse(request.body)
      if ((await dependencies.repository.getPaper(version.paperId)) === null) {
        throw new ApplicationError(
          'PAPER_NOT_FOUND',
          'Parent paper not found',
          404,
        )
      }
      await dependencies.repository.savePaperVersion(version)
      return reply.status(201).send({ data: version })
    },
  })

  app.get('/v1/reports/:slug', {
    schema: {
      tags: ['reports'],
      params: Type.Object({ slug: Type.String({ minLength: 1 }) }),
      response: {
        200: Type.Object({ data: Type.Unknown() }),
        404: ErrorResponse,
      },
    },
    handler: async (request) => {
      const edition = await dependencies.repository.getEditionBySlug(
        request.params.slug,
      )
      if (edition === null) {
        throw new ApplicationError('REPORT_NOT_FOUND', 'Report not found', 404)
      }
      return { data: edition }
    },
  })

  const IntegrityReviewBody = Type.Object({
    pageMappingsValidated: Type.Boolean(),
    definitionsValidated: Type.Boolean(),
    claimKindsDistinct: Type.Boolean(),
    visualsValidated: Type.Boolean(),
  })
  app.post('/v1/reports/:id/approve', {
    schema: {
      tags: ['editorial'],
      params: IdParams,
      body: IntegrityReviewBody,
      response: {
        200: Type.Object({ data: Type.Unknown() }),
        401: ErrorResponse,
        409: ErrorResponse,
      },
    },
    handler: async (request) => {
      const identity = requireEditor(
        request,
        dependencies.config.GLYPH_EDITOR_TOKEN,
      )
      return {
        data: await editorialService.approve({
          reportId: request.params.id,
          editorId: identity.actorId,
          integrityReview: request.body,
        }),
      }
    },
  })
  app.post('/v1/reports/:id/publish', {
    schema: {
      tags: ['editorial'],
      params: IdParams,
      body: IntegrityReviewBody,
      response: {
        200: Type.Object({ data: Type.Unknown() }),
        401: ErrorResponse,
        409: ErrorResponse,
      },
    },
    handler: async (request) => {
      requireEditor(request, dependencies.config.GLYPH_EDITOR_TOKEN)
      return {
        data: await editorialService.publish({
          reportId: request.params.id,
          integrityReview: request.body,
        }),
      }
    },
  })

  app.post('/v1/pipeline/runs', {
    schema: {
      tags: ['pipeline'],
      body: Type.Object({
        paperVersionId: Type.String({ minLength: 1 }),
        stage: Type.String({ minLength: 1 }),
        idempotencyKey: Type.String({ minLength: 8, maxLength: 240 }),
      }),
      response: {
        200: Type.Object({ data: Type.Unknown() }),
        400: ErrorResponse,
        401: ErrorResponse,
        409: ErrorResponse,
      },
    },
    handler: async (request) => {
      requireEditor(request, dependencies.config.GLYPH_EDITOR_TOKEN)
      const stage = PipelineStageSchema.parse(request.body.stage)
      return {
        data: await pipelineService.run({
          paperVersionId: request.body.paperVersionId,
          stage,
          idempotencyKey: request.body.idempotencyKey,
        }),
      }
    },
  })
  app.get('/v1/pipeline/runs/:idempotencyKey', {
    schema: {
      tags: ['pipeline'],
      params: Type.Object({ idempotencyKey: Type.String({ minLength: 1 }) }),
      response: {
        200: Type.Object({ data: Type.Unknown() }),
        404: ErrorResponse,
      },
    },
    handler: async (request) => {
      const run = await dependencies.repository.findPipelineRun(
        request.params.idempotencyKey,
      )
      if (run === null) {
        throw new ApplicationError(
          'PIPELINE_RUN_NOT_FOUND',
          'Pipeline run not found',
          404,
        )
      }
      return { data: run }
    },
  })

  app.get('/v1/runtime-agents', {
    schema: {
      tags: ['runtime-agents'],
      response: { 200: Type.Object({ data: Type.Unknown() }) },
    },
    handler: () => ({ data: runtimeAgentDefinitions }),
  })

  app.put('/v1/paper-label-ontologies/:id', {
    schema: {
      tags: ['runtime-agents'],
      params: IdParams,
      body: Type.Unknown(),
      response: {
        200: Type.Object({ data: Type.Unknown() }),
        400: ErrorResponse,
        401: ErrorResponse,
      },
    },
    handler: async (request) => {
      const identity = requireEditor(
        request,
        dependencies.config.GLYPH_EDITOR_TOKEN,
      )
      const parsed = PaperLabelOntologySchema.omit({
        approvedAt: true,
        approvedBy: true,
      }).parse(request.body)
      if (request.params.id !== parsed.id) {
        throw new ApplicationError(
          'ONTOLOGY_ID_MISMATCH',
          'Ontology path and body IDs must match',
          400,
        )
      }
      return { data: await ontologyService.save(parsed, identity.actorId) }
    },
  })

  app.get('/v1/paper-label-ontologies/:id', {
    schema: {
      tags: ['runtime-agents'],
      params: IdParams,
      response: {
        200: Type.Object({ data: Type.Unknown() }),
        404: ErrorResponse,
      },
    },
    handler: async (request) => ({
      data: await ontologyService.get(request.params.id),
    }),
  })

  app.post('/v1/source-scans', {
    schema: {
      tags: ['source-tracker'],
      body: Type.Object({
        sourceIds: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
      }),
      response: {
        201: Type.Object({ data: Type.Unknown() }),
        401: ErrorResponse,
      },
    },
    handler: async (request, reply) => {
      requireEditor(request, dependencies.config.GLYPH_EDITOR_TOKEN)
      const scan = await sourceTracker.scan({
        trigger: 'MANUAL',
        ...(request.body.sourceIds === undefined
          ? {}
          : { sourceIds: request.body.sourceIds }),
      })
      return reply.status(201).send({ data: scan })
    },
  })

  app.get('/v1/source-scans/:id', {
    schema: {
      tags: ['source-tracker'],
      params: IdParams,
      response: {
        200: Type.Object({ data: Type.Unknown() }),
        404: ErrorResponse,
      },
    },
    handler: async (request) => {
      const scan = await dependencies.repository.getSourceScan(
        request.params.id,
      )
      if (scan === null) {
        throw new ApplicationError(
          'SOURCE_SCAN_NOT_FOUND',
          'Source scan not found',
          404,
        )
      }
      return { data: scan }
    },
  })

  app.post('/v1/runtime-workflows', {
    schema: {
      tags: ['runtime-agents'],
      body: Type.Object({
        paperVersionIds: Type.Array(Type.String({ minLength: 1 }), {
          minItems: 3,
        }),
        ontologyId: Type.String({ minLength: 1 }),
      }),
      response: {
        201: Type.Object({ data: Type.Unknown() }),
        401: ErrorResponse,
        409: ErrorResponse,
        503: ErrorResponse,
      },
    },
    handler: async (request, reply) => {
      requireEditor(request, dependencies.config.GLYPH_EDITOR_TOKEN)
      const service = requireRuntimeWorkflow(workflowService)
      const workflow = await service.start({
        paperVersionIds: request.body.paperVersionIds,
        ontologyId: request.body.ontologyId,
      })
      return reply.status(201).send({ data: workflow })
    },
  })

  app.get('/v1/runtime-workflows/:id', {
    schema: {
      tags: ['runtime-agents'],
      params: IdParams,
      response: {
        200: Type.Object({ data: Type.Unknown() }),
        404: ErrorResponse,
      },
    },
    handler: async (request) => {
      const workflow = await dependencies.repository.getRuntimeWorkflow(
        request.params.id,
      )
      if (workflow === null) {
        throw new ApplicationError(
          'WORKFLOW_NOT_FOUND',
          'Runtime workflow not found',
          404,
        )
      }
      return { data: workflow }
    },
  })

  app.get('/v1/runtime-workflows/:id/agent-runs', {
    schema: {
      tags: ['runtime-agents'],
      params: IdParams,
      response: { 200: Type.Object({ data: Type.Array(Type.Unknown()) }) },
    },
    handler: async (request) => ({
      data: await dependencies.repository.listAgentRuns(request.params.id),
    }),
  })

  app.post('/v1/runtime-workflows/:id/select', {
    schema: {
      tags: ['runtime-agents'],
      params: IdParams,
      body: Type.Object({ paperVersionId: Type.String({ minLength: 1 }) }),
      response: {
        200: Type.Object({ data: Type.Unknown() }),
        401: ErrorResponse,
        409: ErrorResponse,
        503: ErrorResponse,
      },
    },
    handler: async (request) => {
      const identity = requireEditor(
        request,
        dependencies.config.GLYPH_EDITOR_TOKEN,
      )
      return {
        data: await requireRuntimeWorkflow(workflowService).select({
          workflowId: request.params.id,
          paperVersionId: request.body.paperVersionId,
          editorId: identity.actorId,
        }),
      }
    },
  })

  app.post('/v1/runtime-workflows/:id/process', {
    schema: {
      tags: ['runtime-agents'],
      params: IdParams,
      body: Type.Object({ approvedMarketData: Type.Array(Type.Unknown()) }),
      response: {
        200: Type.Object({ data: Type.Unknown() }),
        401: ErrorResponse,
        409: ErrorResponse,
        503: ErrorResponse,
      },
    },
    handler: async (request) => {
      requireEditor(request, dependencies.config.GLYPH_EDITOR_TOKEN)
      const parsed = MarketContextInputSchema.shape.approvedMarketData.parse(
        request.body.approvedMarketData,
      )
      return {
        data: await requireRuntimeWorkflow(workflowService).processSelected({
          workflowId: request.params.id,
          approvedMarketData: parsed,
        }),
      }
    },
  })

  app.get('/v1/editorial-packages/:id', {
    schema: {
      tags: ['runtime-agents'],
      params: IdParams,
      response: {
        200: Type.Object({ data: Type.Unknown() }),
        404: ErrorResponse,
      },
    },
    handler: async (request) => {
      const record = await dependencies.repository.getEditorialPackage(
        request.params.id,
      )
      if (record === null) {
        throw new ApplicationError(
          'PACKAGE_NOT_FOUND',
          'Editorial package not found',
          404,
        )
      }
      return { data: record }
    },
  })

  app.post('/v1/editorial-packages/:id/approve', {
    schema: {
      tags: ['runtime-agents'],
      params: IdParams,
      response: {
        200: Type.Object({ data: Type.Unknown() }),
        401: ErrorResponse,
        409: ErrorResponse,
      },
    },
    handler: async (request) => {
      const identity = requireEditor(
        request,
        dependencies.config.GLYPH_EDITOR_TOKEN,
      )
      return {
        data: await runtimePublication.approve(
          request.params.id,
          identity.actorId,
        ),
      }
    },
  })

  app.post('/v1/editorial-packages/:id/publish', {
    schema: {
      tags: ['runtime-agents'],
      params: IdParams,
      response: {
        200: Type.Object({ data: Type.Unknown() }),
        401: ErrorResponse,
        409: ErrorResponse,
      },
    },
    handler: async (request) => {
      requireEditor(request, dependencies.config.GLYPH_EDITOR_TOKEN)
      return { data: await runtimePublication.publish(request.params.id) }
    },
  })

  return app
}

export type IntegrityReview = PublicationInput['integrityReview']

function requireRuntimeWorkflow(
  service: RuntimeWorkflowService | null,
): RuntimeWorkflowService {
  if (service === null) {
    throw new ApplicationError(
      'RUNTIME_AGENTS_NOT_CONFIGURED',
      'OPENAI_API_KEY is required to execute runtime agents',
      503,
    )
  }
  return service
}
