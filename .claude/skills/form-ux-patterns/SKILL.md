---
name: form-ux-patterns
description: Master form UX patterns including validation strategies, error handling, multi-step forms, and accessible form components. Use when building forms, implementing validation, or improving form user experience.
---

# Form UX Patterns

Create intuitive, accessible forms with clear validation feedback and smooth user experiences.

## When to Use This Skill

- Building registration or checkout forms
- Implementing form validation strategies
- Creating multi-step form wizards
- Designing accessible form components
- Handling form errors gracefully
- Optimizing form completion rates

## Core Concepts

### 1. Validation Timing Strategies

| Strategy | When to Use | User Experience |
|----------|-------------|-----------------|
| **On Submit** | Simple forms | Validates all at once |
| **On Blur** | Most forms | Validates when leaving field |
| **On Change** | Real-time feedback | Validates while typing (debounced) |
| **Hybrid** | Complex forms | Blur + submit validation |

### 2. Error Display Patterns

```
✅ Best: Inline errors below field
⚠️ Acceptable: Error summary at top + inline
❌ Avoid: Alerts/modals, errors only at top
```

## React Hook Form Patterns

### Pattern 1: Basic Form with Validation

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur", // Validate on blur
  });

  const onSubmit = async (data: FormData) => {
    await loginUser(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FormField
        label="Email"
        error={errors.email?.message}
        {...register("email")}
        type="email"
        autoComplete="email"
      />
      <FormField
        label="Password"
        error={errors.password?.message}
        {...register("password")}
        type="password"
        autoComplete="current-password"
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
```

### Pattern 2: Accessible Form Field Component

```tsx
import { forwardRef } from "react";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, id, ...props }, ref) => {
    const fieldId = id || `field-${label.toLowerCase().replace(/\s/g, "-")}`;
    const errorId = `${fieldId}-error`;
    const hintId = `${fieldId}-hint`;

    return (
      <div className="space-y-1.5">
        <label htmlFor={fieldId} className="block text-sm font-medium">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {hint && (
          <p id={hintId} className="text-sm text-gray-500">{hint}</p>
        )}
        <input
          ref={ref}
          id={fieldId}
          aria-describedby={`${hint ? hintId : ""} ${error ? errorId : ""}`.trim() || undefined}
          aria-invalid={error ? "true" : undefined}
          className={`w-full rounded-md border px-3 py-2 ${
            error ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
          }`}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);
```

### Pattern 3: Multi-Step Form Wizard

```tsx
import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";

const STEPS = ["Account", "Profile", "Review"];

export function MultiStepForm() {
  const [step, setStep] = useState(0);
  const methods = useForm({ mode: "onBlur" });

  const nextStep = async () => {
    const isValid = await methods.trigger(getFieldsForStep(step));
    if (isValid) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <FormProvider {...methods}>
      {/* Progress indicator */}
      <nav aria-label="Form progress" className="flex gap-2 mb-6">
        {STEPS.map((name, i) => (
          <div
            key={name}
            className={`flex-1 h-2 rounded ${i <= step ? "bg-blue-500" : "bg-gray-200"}`}
            aria-current={i === step ? "step" : undefined}
          />
        ))}
      </nav>

      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {step === 0 && <AccountStep />}
        {step === 1 && <ProfileStep />}
        {step === 2 && <ReviewStep />}

        <div className="flex gap-4 mt-6">
          {step > 0 && (
            <button type="button" onClick={prevStep}>Back</button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={nextStep}>Continue</button>
          ) : (
            <button type="submit">Submit</button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
```

### Pattern 4: Real-Time Validation Feedback

```tsx
// Password strength indicator
export function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", valid: password.length >= 8 },
    { label: "Uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "Lowercase letter", valid: /[a-z]/.test(password) },
    { label: "Number", valid: /\d/.test(password) },
  ];

  const strength = checks.filter((c) => c.valid).length;

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded ${
              strength >= level
                ? strength <= 2 ? "bg-red-500" : strength === 3 ? "bg-yellow-500" : "bg-green-500"
                : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <ul className="text-xs space-y-1">
        {checks.map(({ label, valid }) => (
          <li key={label} className={valid ? "text-green-600" : "text-gray-500"}>
            {valid ? "✓" : "○"} {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Accessibility Requirements

- **Labels**: Every input must have an associated `<label>`
- **Error IDs**: Link errors to inputs with `aria-describedby`
- **Invalid state**: Use `aria-invalid="true"` on error
- **Live regions**: Use `role="alert"` for error messages
- **Focus management**: Focus first error field on submit failure

## Best Practices

### Do's
- Show errors inline, close to the field
- Use clear, actionable error messages
- Preserve user input on validation failure
- Indicate required fields with asterisk (*)
- Support keyboard navigation and submission

### Don'ts
- Don't clear the form on validation error
- Don't use red color alone for errors (add icon/text)
- Don't validate while user is actively typing
- Don't disable the submit button entirely
- Don't use placeholder as label substitute

