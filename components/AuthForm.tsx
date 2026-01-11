"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import CustomFormField from "@/components/FormField"
import { useRouter } from "next/navigation"

type FormType = "sign-in" | "sign-up"

/* ---------------- SCHEMA ---------------- */
const AuthFormSchema = (type: FormType) =>
  z.object({
    name:
      type === "sign-up"
        ? z.string().min(3, "Name must be at least 3 characters")
        : z.string().optional(),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })

/* ---------------- COMPONENT ---------------- */
const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter()
  const isSignIn = type === "sign-in"

  const formSchema = AuthFormSchema(type)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),

    // 🔥 IMPORTANT: defaultValues must match schema
    defaultValues:
      type === "sign-up"
        ? {
            name: "",
            email: "",
            password: "",
          }
        : {
            email: "",
            password: "",
          },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      console.log(values) // <-- real values

      if (isSignIn) {
        toast.success("Signed in successfully")
        router.push("/")
      } else {
        toast.success("Account created successfully")
        router.push("/sign-in")
      }
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong")
    }
  }

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2">
          <Image src="/logo.svg" alt="logo" width={32} height={38} />
          <h2 className="text-xl font-semibold text-primary-100">
            PerpWise AI
          </h2>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Practice mock interviews with AI
        </p>

        {/* Form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6 mt-4"
          >
            {!isSignIn && (
              <CustomFormField
                control={form.control}
                name="name"
                label="Full Name"
                placeholder="Enter your full name"
              />
            )}

            <CustomFormField
              control={form.control}
              name="email"
              label="Email"
              placeholder="Enter your email"
              type="email"
            />

            <CustomFormField
              control={form.control}
              name="password"
              label="Password"
              placeholder="Enter your password"
              type="password"
            />

            <Button
              type="submit"
              className="btn w-full"
              disabled={form.formState.isSubmitting}
            >
              {isSignIn ? "Sign In" : "Create Account"}
            </Button>
          </form>
        </Form>

        {/* Switch */}
        <p className="text-center text-sm">
          {isSignIn ? "Don't have an account?" : "Already have an account?"}
          <Link
            href={isSignIn ? "/sign-up" : "/sign-in"}
            className="font-bold text-primary ml-1"
          >
            {isSignIn ? "Sign Up" : "Sign In"}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default AuthForm
