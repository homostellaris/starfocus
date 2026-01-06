import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
	return {
		// Customize default HTML elements with Tailwind styling
		h1: ({ children }) => (
			<h1 className="mb-4 mt-8 text-4xl font-bold">{children}</h1>
		),
		h2: ({ children }) => (
			<h2 className="mb-3 mt-6 text-3xl font-semibold">{children}</h2>
		),
		h3: ({ children }) => (
			<h3 className="mb-2 mt-4 text-2xl font-semibold">{children}</h3>
		),
		h4: ({ children }) => (
			<h4 className="mb-2 mt-3 text-xl font-semibold">{children}</h4>
		),
		p: ({ children }) => <p className="mb-4 leading-7">{children}</p>,
		ul: ({ children }) => <ul className="mb-4 ml-6 list-disc">{children}</ul>,
		ol: ({ children }) => (
			<ol className="mb-4 ml-6 list-decimal">{children}</ol>
		),
		li: ({ children }) => <li className="mb-1">{children}</li>,
		a: ({ children, href }) => (
			<a
				href={href}
				className="text-blue-600 underline hover:text-blue-800"
			>
				{children}
			</a>
		),
		code: ({ children }) => (
			<code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-sm">
				{children}
			</code>
		),
		pre: ({ children }) => (
			<pre className="mb-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-white">
				{children}
			</pre>
		),
		blockquote: ({ children }) => (
			<blockquote className="border-l-4 border-gray-300 pl-4 italic">
				{children}
			</blockquote>
		),
		// Add any custom components you want to use in MDX
		...components,
	}
}
