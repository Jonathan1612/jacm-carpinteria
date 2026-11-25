import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap section narrow">
      <h1>No encontramos esa página</h1>
      <p className="lede">El taller pudo haberse ido, o el enlace está incompleto.</p>
      <Link className="btn btn-primary" href="/">
        Volver al inicio
      </Link>
    </main>
  );
}
