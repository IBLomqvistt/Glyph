'use client'

import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export function ReaderPaperSearch({
  papers,
}: {
  papers: ReadonlyArray<{ slug: string; title: string }>
}): React.JSX.Element {
  const router = useRouter()

  return (
    <form
      className="reader-search"
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        const input = data.get('paper')
        const query =
          typeof input === 'string' ? input.trim().toLowerCase() : ''
        const match = papers.find((paper) =>
          paper.title.toLowerCase().includes(query),
        )
        if (match) router.push(`/reader/${match.slug}`)
      }}
    >
      <Search aria-hidden="true" size={17} />
      <label className="sr-only" htmlFor="reader-paper-search">
        Search existing papers
      </label>
      <input
        id="reader-paper-search"
        name="paper"
        type="search"
        list="reader-paper-options"
        placeholder="Search existing papers…"
      />
      <datalist id="reader-paper-options">
        {papers.map((paper) => (
          <option key={paper.slug} value={paper.title} />
        ))}
      </datalist>
      <button type="submit">Open</button>
    </form>
  )
}
