import React, { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, Lock, Mail, UserPlus } from "lucide-react";

const vertexSmokeySource = `
  attribute vec4 a_position;
  void main() {
    gl_Position = a_position;
  }
`;

const fragmentSmokeySource = `
precision mediump float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
uniform vec3 u_color;

void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 centeredUV = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);
    float time = iTime * 0.5;

    vec2 mouse = iMouse / iResolution;
    vec2 rippleCenter = 2.0 * mouse - 1.0;

    vec2 distortion = centeredUV;
    for (float i = 1.0; i < 8.0; i++) {
        distortion.x += 0.5 / i * cos(i * 2.0 * distortion.y + time + rippleCenter.x * 3.1415);
        distortion.y += 0.5 / i * cos(i * 2.0 * distortion.x + time + rippleCenter.y * 3.1415);
    }

    float wave = abs(sin(distortion.x + distortion.y + time));
    float glow = smoothstep(0.9, 0.2, wave);

    fragColor = vec4(u_color * glow, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

type BlurSize = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
export type AuthMode = "login" | "signup" | "forgot-password" | "password-recovery";

interface SmokeyBackgroundProps {
  backdropBlurAmount?: string;
  color?: string;
  className?: string;
}

interface LoginFormProps {
  mode: AuthMode;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  loading: boolean;
  error: string;
  message: string;
  passwordMismatch: boolean;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleLogin: () => void;
  onModeChange: (mode: "login" | "signup" | "forgot-password") => void;
  onBackToLogin: () => void;
}

const blurClassMap: Record<BlurSize, string> = {
  none: "backdrop-blur-none",
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
  lg: "backdrop-blur-lg",
  xl: "backdrop-blur-xl",
  "2xl": "backdrop-blur-2xl",
  "3xl": "backdrop-blur-3xl",
};

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.startsWith("#") ? hex : `#${hex}`;
  const r = parseInt(normalized.substring(1, 3), 16) / 255;
  const g = parseInt(normalized.substring(3, 5), 16) / 255;
  const b = parseInt(normalized.substring(5, 7), 16) / 255;
  return [r, g, b];
}

export function SmokeyBackground({
  backdropBlurAmount = "sm",
  color = "#1E40AF",
  className = "",
}: SmokeyBackgroundProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const hoveringRef = useRef(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    const compileShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;

      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compilation error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }

      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSmokeySource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSmokeySource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program linking error:", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return;
    }

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
    const iTimeLocation = gl.getUniformLocation(program, "iTime");
    const iMouseLocation = gl.getUniformLocation(program, "iMouse");
    const uColorLocation = gl.getUniformLocation(program, "u_color");

    const [r, g, b] = hexToRgb(color);
    gl.uniform3f(uColorLocation, r, g, b);

    const startTime = performance.now();

    const render = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      const mouse = mouseRef.current;
      const hovering = hoveringRef.current;
      const currentTime = (performance.now() - startTime) / 1000;

      gl.uniform2f(iResolutionLocation, width, height);
      gl.uniform1f(iTimeLocation, currentTime);
      gl.uniform2f(
        iMouseLocation,
        hovering ? mouse.x : width / 2,
        hovering ? height - mouse.y : height / 2,
      );

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      frameRef.current = requestAnimationFrame(render);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const handleMouseEnter = () => {
      hoveringRef.current = true;
    };

    const handleMouseLeave = () => {
      hoveringRef.current = false;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseenter", handleMouseEnter);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    render();

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }

      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseenter", handleMouseEnter);
      canvas.removeEventListener("mouseleave", handleMouseLeave);

      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [color]);

  const finalBlurClass = blurClassMap[backdropBlurAmount as BlurSize] || blurClassMap.sm;

  return (
    <div className={`absolute inset-0 h-full w-full overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className={`absolute inset-0 bg-slate-950/35 ${finalBlurClass}`} />
    </div>
  );
}

function FloatingField({
  id,
  type,
  label,
  value,
  onChange,
  icon,
  autoComplete,
  invalid = false,
  required = true,
}: {
  id: string;
  type: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  autoComplete?: string;
  invalid?: boolean;
  required?: boolean;
}) {
  return (
    <div className="relative z-0">
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required={required}
        placeholder=" "
        className={`peer block w-full border-0 border-b-2 bg-transparent px-0 py-3 text-sm text-white placeholder-transparent focus:outline-none focus:ring-0 ${invalid ? "border-red-400 focus:border-red-400" : "border-white/35 focus:border-cyan-400"
          }`}
      />
      <label
        htmlFor={id}
        className="absolute top-3 -z-10 origin-[0] -translate-y-6 scale-75 transform text-sm text-slate-300 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-cyan-300"
      >
        <span className="inline-flex items-center gap-2">
          {icon}
          {label}
        </span>
      </label>
    </div>
  );
}

export function LoginForm({
  mode,
  name,
  email,
  password,
  confirmPassword,
  loading,
  error,
  message,
  passwordMismatch,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onGoogleLogin,
  onModeChange,
  onBackToLogin,
}: LoginFormProps): React.ReactElement {
  const isSignup = mode === "signup";
  const isForgotPassword = mode === "forgot-password";
  const isPasswordRecovery = mode === "password-recovery";
  const showEmail = !isPasswordRecovery;
  const showPassword = !isForgotPassword || isPasswordRecovery;
  const showConfirmPassword = isSignup || isPasswordRecovery;
  const showGoogle = mode === "login" || mode === "signup";

  const title = isForgotPassword
    ? "Reset your password"
    : isPasswordRecovery
      ? "Create a new password"
      : isSignup
        ? "Create your account"
        : "Welcome Back";

  const description = isForgotPassword
    ? "We will email you a secure reset link."
    : isPasswordRecovery
      ? "Choose a new password to continue into Spendora."
      : isSignup
        ? "Start tracking expenses with a cinematic touch."
        : "Sign in to continue into your workspace.";

  const submitLabel = loading
    ? "Processing..."
    : isPasswordRecovery
      ? "Update password"
      : isForgotPassword
        ? "Send reset link"
        : isSignup
          ? "Create account"
          : "Sign in";

  return (
    <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
            <span className="text-lg font-extrabold tracking-[0.35em] text-cyan-300">SPEND</span>
            <span className="text-lg font-extrabold tracking-[0.35em] text-white">ORA</span>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/15 bg-white/10 p-7 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{description}</p>
          </div>

          <form className="mt-8 space-y-7" onSubmit={onSubmit}>
            {error && (
              <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {message}
              </div>
            )}

            <div className="space-y-6">
              {isSignup && (
                <FloatingField
                  id="auth_name"
                  type="text"
                  label="Full Name"
                  value={name}
                  onChange={onNameChange}
                  autoComplete="name"
                  icon={<UserPlus size={16} className="text-cyan-300" />}
                />
              )}

              {showEmail && (
                <FloatingField
                  id="auth_email"
                  type="email"
                  label="Email Address"
                  value={email}
                  onChange={onEmailChange}
                  autoComplete="email"
                  icon={<Mail size={16} className="text-cyan-300" />}
                />
              )}

              {showPassword && (
                <FloatingField
                  id="auth_password"
                  type="password"
                  label={isPasswordRecovery ? "New Password" : "Password"}
                  value={password}
                  onChange={onPasswordChange}
                  autoComplete={isSignup || isPasswordRecovery ? "new-password" : "current-password"}
                  icon={<Lock size={16} className="text-cyan-300" />}
                />
              )}

              {showConfirmPassword && (
                <div>
                  <FloatingField
                    id="auth_confirm_password"
                    type="password"
                    label="Confirm Password"
                    value={confirmPassword}
                    onChange={onConfirmPasswordChange}
                    autoComplete="new-password"
                    invalid={passwordMismatch}
                    icon={<Lock size={16} className="text-cyan-300" />}
                  />
                  {passwordMismatch && (
                    <p className="mt-2 text-xs text-red-300">Passwords do not match.</p>
                  )}
                </div>
              )}
            </div>

            {mode === "login" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onModeChange("forgot-password")}
                  className="text-xs font-medium tracking-wide text-slate-300 transition hover:text-white"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition-all duration-300 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitLabel}
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>

            {showGoogle && (
              <>
                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t border-white/15" />
                  <span className="mx-4 text-[11px] font-medium tracking-[0.25em] text-slate-400">
                    OR CONTINUE WITH
                  </span>
                  <div className="flex-grow border-t border-white/15" />
                </div>

                <button
                  type="button"
                  onClick={onGoogleLogin}
                  disabled={loading}
                  className="flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition-all duration-300 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.802 8.841C34.553 4.806 29.613 2.5 24 2.5C11.983 2.5 2.5 11.983 2.5 24s9.483 21.5 21.5 21.5S45.5 36.017 45.5 24c0-1.538-.135-3.022-.389-4.417z" />
                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12.5 24 12.5c3.059 0 5.842 1.154 7.961 3.039l5.839-5.841C34.553 4.806 29.613 2.5 24 2.5C16.318 2.5 9.642 6.723 6.306 14.691z" />
                    <path fill="#4CAF50" d="M24 45.5c5.613 0 10.553-2.306 14.802-6.341l-5.839-5.841C30.842 35.846 27.059 38 24 38c-5.039 0-9.345-2.608-11.124-6.481l-6.571 4.819C9.642 41.277 16.318 45.5 24 45.5z" />
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l5.839 5.841C44.196 35.123 45.5 29.837 45.5 24c0-1.538-.135-3.022-.389-4.417z" />
                  </svg>
                  Continue with Google
                </button>
              </>
            )}
          </form>

          {(isForgotPassword || isPasswordRecovery) ? (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={onBackToLogin}
                className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
              >
                <ArrowLeft size={16} />
                Back to sign in
              </button>
            </div>
          ) : (
            <p className="mt-6 text-center text-sm text-slate-300">
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                onClick={() => onModeChange(isSignup ? "login" : "signup")}
                className="font-semibold text-cyan-300 transition hover:text-cyan-200"
              >
                {isSignup ? "Sign in" : "Sign up"}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
