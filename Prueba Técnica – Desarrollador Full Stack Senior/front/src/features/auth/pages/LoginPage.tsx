import { useState, type FormEvent } from 'react'
import { Icon } from '@iconify/react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useLogin } from '@/features/auth/hooks/useLogin'
import Button from '@/shared/components/Button'
import Input from '@/shared/components/Input'

function LoginPage({ destination }: { destination: string }) {
    const navigate = useNavigate()
    const { state } = useLocation()
    const [showPassword, setShowPassword] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const { submitLogin, isLoading, error, successMessage } = useLogin()

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const session = await submitLogin({ email, password })
        if (session) navigate(destination, { replace: true })
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
                    <Input
                        id="email"
                        type="email"
                        size="lg"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="nombre@empresa.com"
                        autoComplete="email"
                        startIcon={<Icon icon="solar:letter-linear" width="20" />}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password" className="mb-2 block text-sm font-semibold text-secondary-900">
                        Contraseña
                    </label>
                    <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        size="lg"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Ingresa tu contraseña"
                        autoComplete="current-password"
                        startIcon={<Icon icon="solar:lock-keyhole-linear" width="20" />}
                        endAdornment={
                            <button
                                type="button"
                                onClick={() => setShowPassword((visible) => !visible)}
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                className="text-secondary-600 transition-colors hover:text-primary-700"
                            >
                                <Icon icon={showPassword ? 'solar:eye-closed-linear' : 'solar:eye-linear'} width="21" />
                            </button>
                        }
                        required
                    />
                </div>

                <Button
                    type="submit"
                    size="lg"
                    fullWidth
                    loading={isLoading}
                    loadingText="Validando..."
                >
                    Iniciar sesión
                </Button>
            </form>

            <div className="mt-8 text-center">
                <p className="mt-3 text-sm text-secondary-600">
                    ¿No tienes cuenta?{' '}
                    <Link to="/register" state={state} className="font-medium text-primary-700 hover:text-primary-800">
                        Crear cuenta
                    </Link>
                </p>
            </div>
        </>
    )
}

export default LoginPage
