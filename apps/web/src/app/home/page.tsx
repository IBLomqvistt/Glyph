import Link from 'next/link'
import { ArrowUpRight, CalendarDays, Clock3 } from 'lucide-react'
import { LayerNavigation } from '@/components/layer-navigation'
import { featuredReport } from '@/lib/featured-report'

const contentTags = featuredReport.topicLabels

const editionDate = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
}).format(new Date(`${featuredReport.publicationDate}T00:00:00Z`))

export default function ProductHomePage(): React.JSX.Element {
  return (
    <div className="page page-wide today-home">
      <header className="today-hero">
        <div>
          <span className="eyebrow">Daily research brief</span>
          <h1>What’s new today</h1>
          <p>
            Open a paper title in the full report, or choose a content tag to
            browse its category.
          </p>
        </div>
        <time className="today-date" dateTime={featuredReport.publicationDate}>
          <CalendarDays aria-hidden="true" size={18} strokeWidth={1.7} />
          <span>
            <small>Today’s edition</small>
            {editionDate}
          </span>
        </time>
      </header>

      <section className="today-categories" aria-labelledby="categories-title">
        <div className="today-categories-heading">
          <span className="eyebrow">Explore by category</span>
          <h2 id="categories-title">Browse the AI stack</h2>
        </div>
        <LayerNavigation ariaLabel="Research categories" />
      </section>

      <section className="today-feed" aria-labelledby="today-feed-title">
        <div className="today-feed-heading">
          <div>
            <span className="eyebrow">Latest analysis</span>
            <h2 id="today-feed-title">Today’s paper</h2>
          </div>
          <span className="today-result-count">1 real report</span>
        </div>

        <article className="today-paper-card" data-testid="today-paper">
          <div className="today-paper-rank" aria-hidden="true">
            01
          </div>
          <div className="today-paper-content">
            <div className="today-paper-topline">
              <span>{featuredReport.provider}</span>
              <span>{featuredReport.statusLabel}</span>
            </div>
            <Link
              className="today-paper-title"
              href={featuredReport.reportPath}
              data-testid="today-paper-title"
            >
              <h2>{featuredReport.title}</h2>
              <ArrowUpRight aria-hidden="true" size={24} strokeWidth={1.6} />
            </Link>
            <p className="today-paper-summary">{featuredReport.summary}</p>
            <nav
              className="today-paper-tags"
              aria-label={`Content tags for ${featuredReport.title}`}
            >
              {contentTags.map((tag, index) => (
                <Link
                  key={tag}
                  href={featuredReport.categoryHref}
                  className="today-paper-tag"
                  data-testid={index === 0 ? 'today-tag-models' : undefined}
                  aria-label={`${tag}: browse the Models category`}
                >
                  {tag}
                </Link>
              ))}
            </nav>
            <footer className="today-paper-footer">
              <span>{featuredReport.authors.join(', ')}</span>
              <span>
                <Clock3 aria-hidden="true" size={15} strokeWidth={1.8} />
                {featuredReport.readingTimeMinutes} min read
              </span>
            </footer>
            <p className="today-paper-disclosure">
              Demo workspace · based on the supplied Kimi K3 source capture and
              report pack. Publication remains subject to human approval.
            </p>
          </div>
        </article>
      </section>
    </div>
  )
}
