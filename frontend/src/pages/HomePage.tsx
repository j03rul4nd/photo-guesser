export function HomePage() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '2rem',
          color: 'var(--text-primary)',
          margin: 0,
        }}
      >
        HomePage
      </h1>
    </div>
  )
}
