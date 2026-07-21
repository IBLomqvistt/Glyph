import { InMemoryPipelineRunRepository } from '@glyph/application'
import { LocalJobRunner, runDemoPipeline } from './index'

const results = await runDemoPipeline({
  paperVersionId: 'glyph-agent-swarm-demo-v1',
  runner: new LocalJobRunner(new InMemoryPipelineRunRepository()),
})

for (const run of results) {
  process.stdout.write(`${run.stage}: ${run.status} (attempt ${run.attempt})\n`)
}
