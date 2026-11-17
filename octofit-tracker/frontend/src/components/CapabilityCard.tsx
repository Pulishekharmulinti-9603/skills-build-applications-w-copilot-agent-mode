type Props = { title: string; description: string; status?: string; isError?: boolean };
export function CapabilityCard({ title, description, status, isError }: Props) {
  return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p>{status && <p role={isError ? 'alert' : 'status'}>{status}</p>}</div></section>;
}

