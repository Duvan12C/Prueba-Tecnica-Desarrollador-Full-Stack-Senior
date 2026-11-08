import { useState, type FormEvent } from 'react'
import { Icon } from '@iconify/react'
import { Link } from 'react-router'
import logo from '@/assets/docspace-imagotipo-vertical-oscuro.svg'
import { useSignUp } from '@/features/auth/hooks/signUp'
import type { SignUpCredentials } from '@/features/auth/types/auth.types'
import Button from '@/shared/components/Button'
import Card from '@/shared/components/Card'
import Input from '@/shared/components/Input'

const roles = [
    { name: 'Gestor', description: 'Gestiona su espacio', icon: 'solar:user-circle-linear' },
    { name: 'Colaborador', description: 'Acceso según permisos', icon: 'solar:users-group-rounded-linear' },
] as const

const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-secondary-900'

function CreatePage() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmation, setConfirmation] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmation, setShowConfirmation] = useState(false)
    const [role, setRole] = useState<SignUpCredentials['role_name']>('Colaborador')
    const [validationError, setValidationError] = useState('')
    const { submitSignUp, isLoading, error, successMessage } = useSignUp()

    const checks = [
        password.length >= 12,
        /[A-Z]/.test(password) && /[a-z]/.test(password),
        /[0-9]/.test(password),
        /[^\p{L}\p{N}\s]/u.test(password),
    ]
    const strength = checks.filter(Boolean).length
    const strengthLabel = password ? (strength === 4 ? 'Alta' : strength >= 2 ? 'Media' : 'Baja') : 'Sin evaluar'
    const strengthColor = strength === 4 ? 'bg-tertiary-500' : strength >= 2 ? 'bg-warning' : 'bg-danger'
    const filledSegments = password ? Math.max(1, strength) : 0
    const passwordsMismatch = confirmation.length > 0 && password !== confirmation

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setValidationError('')

        if (!name.trim() || strength !== 4) {
            setValidationError(
                !name.trim() ? 'Escribe tu nombre completo.' :
                'La contraseña debe cumplir todos los requisitos indicados.',
            )
            return
        }

        if (password !== confirmation) return

        await submitSignUp({ name: name.trim(), email: email.trim(), password, role_name: role })
    }

    return (
        <main className="grid min-h-dvh place-items-center bg-neutral-50 p-4 sm:p-8">
            <Card className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl md:grid-cols-[0.85fr_1.15fr]">
                <aside className="relative flex flex-col items-center justify-center gap-4 overflow-hidden bg-gradient-to-br from-secondary-950 via-secondary-950 to-primary-900 px-6 py-8 text-center text-white md:min-h-full md:py-24">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-primary-200 md:absolute md:top-8 md:left-8">
                        • Registro
                    </span>
                    <img src={logo} alt="DocSpace" className="h-24 w-36 object-contain md:h-36 md:w-48" />
                    <p className="max-w-48 text-sm text-primary-100">Únete a una mejor forma de trabajar</p>
                    <p className="hidden text-xs text-primary-200 md:absolute md:bottom-8 md:block">Conecta. Colabora. Avanza.</p>
                </aside>

                <section aria-labelledby="register-title" className="p-6 sm:p-9">
                    <header className="mb-5">
                        <h1 id="register-title" className="font-heading text-3xl font-bold text-secondary-950">Crear cuenta</h1>
                        <p className="mt-1 text-sm text-secondary-600">Completa la información para comenzar.</p>
                    </header>

                    {(validationError || error) && (
                        <p role="alert" className="mb-4 rounded-lg bg-danger-bg p-3 text-sm text-danger-text">{validationError || error}</p>
                    )}
                    {successMessage ? (
                        <p role="status" className="rounded-lg bg-success-bg p-3 text-sm text-success-text">
                            {successMessage}. Ya puedes iniciar sesión.
                        </p>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="register-name" className={labelClass}>Nombre completo</label>
                                <Input id="register-name" autoComplete="name" maxLength={150} required
                                    value={name} onChange={(event) => setName(event.target.value)}
                                    placeholder="Tu nombre completo" startIcon={<Icon icon="solar:user-linear" width="18" />} />
                            </div>
                            <div>
                                <label htmlFor="register-email" className={labelClass}>Correo electrónico</label>
                                <Input id="register-email" type="email" autoComplete="email" required
                                    value={email} onChange={(event) => setEmail(event.target.value)}
                                    placeholder="nombre@empresa.com" startIcon={<Icon icon="solar:letter-linear" width="18" />} />
                            </div>
                            <div>
                                <label htmlFor="register-password" className={labelClass}>Contraseña</label>
                                <Input id="register-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
                                    minLength={12} maxLength={128} required aria-describedby="password-rules"
                                    value={password} onChange={(event) => setPassword(event.target.value)}
                                    startIcon={<Icon icon="solar:lock-keyhole-linear" width="18" />}
                                    endAdornment={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword(!showPassword)} />} />
                                <div className="mt-2 flex justify-between text-xs text-secondary-700" aria-live="polite">
                                    <span>Seguridad de la contraseña</span>
                                    <span>{strengthLabel}</span>
                                </div>
                                <div className="mt-1 grid grid-cols-4 gap-1.5" aria-hidden="true">
                                    {checks.map((_, index) => (
                                        <span key={index} className={`h-1.5 rounded-full motion-safe:transition-colors ${index < filledSegments ? strengthColor : 'bg-neutral-100'}`} />
                                    ))}
                                </div>
                                <p id="password-rules" className="mt-2 text-xs text-secondary-700">
                                    Usa de 12 a 128 caracteres, con mayúsculas, minúsculas, un número y un símbolo como @, # o !.
                                </p>
                            </div>
                            <div>
                                <label htmlFor="register-confirmation" className={labelClass}>Confirmar contraseña</label>
                                <Input id="register-confirmation" type={showConfirmation ? 'text' : 'password'}
                                    autoComplete="new-password" maxLength={128} required
                                    aria-invalid={passwordsMismatch}
                                    aria-describedby={passwordsMismatch ? 'password-mismatch' : undefined}
                                    value={confirmation} onChange={(event) => setConfirmation(event.target.value)}
                                    startIcon={<Icon icon="solar:shield-check-linear" width="18" />}
                                    endAdornment={<PasswordToggle visible={showConfirmation} onToggle={() => setShowConfirmation(!showConfirmation)} />} />
                                <div id="password-mismatch" aria-live="polite">
                                    {passwordsMismatch && (
                                        <p className="mt-2 text-sm font-medium text-danger-text">Las contraseñas no coinciden.</p>
                                    )}
                                </div>
                            </div>
                            <fieldset>
                                <legend className={labelClass}>Tipo de cuenta</legend>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {roles.map(({ name, description, icon }) => (
                                        <label key={name} className="flex cursor-pointer items-center gap-3 rounded-lg border border-neutral-200 p-3 text-sm has-checked:border-primary-600 has-checked:bg-primary-100">
                                            <input type="radio" name="role" value={name} checked={role === name}
                                                onChange={() => setRole(name)} className="accent-primary-600" />
                                            <Icon icon={icon} width="20" aria-hidden="true" />
                                            <span>
                                                <span className="block font-semibold">{name}</span>
                                                <span className="block text-xs text-secondary-700">{description}</span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                            <Button type="submit" size="lg" fullWidth loading={isLoading} loadingText="Creando cuenta…"
                                endIcon={<Icon icon="solar:arrow-right-linear" width="18" />}>
                                Crear cuenta
                            </Button>
                        </form>
                    )}

                    <p className="mt-5 border-t border-neutral-100 pt-4 text-center text-sm text-secondary-600">
                        ¿Ya tienes una cuenta?{' '}
                        <Link to="/login" className="font-semibold text-primary-700 hover:underline">Inicia sesión</Link>
                    </p>
                </section>
            </Card>
        </main>
    )
}

function PasswordToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
    return (
        <button type="button" onClick={onToggle} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="text-secondary-600 hover:text-primary-700">
            <Icon icon={visible ? 'solar:eye-closed-linear' : 'solar:eye-linear'} width="19" />
        </button>
    )
}

export default CreatePage
