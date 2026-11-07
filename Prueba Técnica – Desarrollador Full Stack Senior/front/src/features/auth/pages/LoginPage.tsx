import { useState, type FormEvent } from 'react'
import { Icon } from '@iconify/react'
import { Link } from 'react-router'
import { useLogin } from '@/features/auth/hooks/useLogin'

function LoginPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const { submitLogin, isLoading, error, successMessage } = useLogin()

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        await submitLogin({ email, password })
    }

    return (
        <>
            <header className="mb-10">
                <div className="mb-6 h-1 w-12 rounded-full bg-primary-700" />
                <h2 className="font-heading text-3xl font-bold tracking-tight text-secondary-950 md:text-4xl">
                    Inicia sesión
                </h2>
                <p className="mt-3 text-sm text-secondary-600">Accede a tu espacio de trabajo.</p>
            </header>

            {error && (
                <p role="alert" className="mb-5 rounded-lg bg-danger-bg px-4 py-3 text-sm text-danger-text">
                    {error}
                </p>
            )}
            {successMessage && (
                <p role="status" className="mb-5 rounded-lg bg-success-bg px-4 py-3 text-sm text-success-text">
                    {successMessage}
                </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-semibold text-secondary-900">
                        Correo electrónico
                    </label>
                    <div className="relative">
                        <Icon
                            icon="solar:letter-linear"
                            width="20"
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-secondary-500"
                        />
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="nombre@empresa.com"
                            autoComplete="email"
                            required
                            className="h-14 w-full rounded-xl border border-neutral-200 bg-white pl-12 pr-4 text-sm text-secondary-950 outline-none transition focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="password" className="mb-2 block text-sm font-semibold text-secondary-900">
                        Contraseña
                    </label>
                    <div className="relative">
                        <Icon
                            icon="solar:lock-keyhole-linear"
                            width="20"
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-secondary-500"
                        />
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Ingresa tu contraseña"
                            autoComplete="current-password"
                            required
                            className="h-14 w-full rounded-xl border border-neutral-200 bg-white pl-12 pr-12 text-sm text-secondary-950 outline-none transition focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((visible) => !visible)}
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-600 transition-colors hover:text-primary-700"
                        >
                            <Icon icon={showPassword ? 'solar:eye-closed-linear' : 'solar:eye-linear'} width="21" />
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="h-14 w-full rounded-xl bg-primary-600 text-sm font-semibold text-white shadow-lg shadow-primary-600/20 transition hover:-translate-y-0.5 hover:bg-primary-700 active:translate-y-0 disabled:cursor-wait disabled:opacity-70"
                >
                    {isLoading ? 'Validando...' : 'Iniciar sesión'}
                </button>
            </form>

            <div className="mt-8 text-center">
                <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-primary-700 transition-colors hover:text-primary-800"
                >
                    ¿Olvidaste tu contraseña?
                </Link>
            </div>
        </>
    )
}

export default LoginPage
