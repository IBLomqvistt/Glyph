import { z } from 'zod'

const BooleanStringSchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true')

export const ApiConfigSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    HOST: z.string().trim().min(1).default('127.0.0.1'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    DATABASE_URL: z.string().trim().min(1).optional(),
    GLYPH_EDITOR_TOKEN: z.string().min(24),
    GLYPH_ALLOW_IN_MEMORY: BooleanStringSchema.default(false),
    OPENAI_API_KEY: z.string().trim().min(1).optional(),
    OPENAI_MODEL: z.string().trim().min(1).default('gpt-5.6-terra'),
  })
  .superRefine((config, context) => {
    if (config.DATABASE_URL === undefined && !config.GLYPH_ALLOW_IN_MEMORY) {
      context.addIssue({
        code: 'custom',
        message: 'DATABASE_URL is required unless GLYPH_ALLOW_IN_MEMORY=true',
        path: ['DATABASE_URL'],
      })
    }
    if (config.NODE_ENV === 'production' && config.GLYPH_ALLOW_IN_MEMORY) {
      context.addIssue({
        code: 'custom',
        message: 'In-memory persistence is not permitted in production',
        path: ['GLYPH_ALLOW_IN_MEMORY'],
      })
    }
  })

export type ApiConfig = z.infer<typeof ApiConfigSchema>

export function loadConfig(
  environment: NodeJS.ProcessEnv = process.env,
): ApiConfig {
  return ApiConfigSchema.parse(environment)
}
