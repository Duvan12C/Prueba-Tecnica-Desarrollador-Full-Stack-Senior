import { Link } from 'react-router'

function ForgotPasswordPage() {
  return (
    <section>
      <div className="mb-6 h-1 w-12 rounded-full bg-primary-700" />
      <h2 className="font-heading text-3xl font-bold tracking-tight text-secondary-950 md:text-4xl">
        Recuperar contraseña
      </h2>
      <p className="mt-3 text-sm leading-6 text-secondary-600">
        La recuperación de contraseña estará disponible próximamente.
      </p>
      <Link
        to="/login"
        className="mt-8 inline-flex text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800"
      >
        Volver al inicio de sesión
      </Link>
    </section>
  )
}

export default ForgotPasswordPage
