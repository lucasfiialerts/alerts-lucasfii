"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const formSchema = z.object({
  email: z.string().email("E-mail inválido!"),
});

type FormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordPage() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await authClient.forgetPassword({
        email: values.email,
        fetchOptions: {
          onSuccess: () => {
            toast.success(
              "Se o e-mail existir, você receberá um link para redefinir sua senha."
            );
            form.reset();
          },
          onError: () => {
            toast.success(
              "Se o e-mail existir, você receberá um link para redefinir sua senha."
            );
            form.reset();
          },
        },
      });
    } catch (error) {
      toast.success(
        "Se o e-mail existir, você receberá um link para redefinir sua senha."
      );
      form.reset();
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative px-4" style={{ backgroundColor: '#111115' }}>
      {/* Botão Voltar */}
      <Button
        variant="ghost"
        className="absolute left-4 top-4 md:left-8 md:top-8 flex items-center gap-2 text-gray-300 hover:text-white hover:bg-gray-800/50"
        asChild
      >
        <Link href="/authentication">
          <ArrowLeft className="h-4 w-4" />
          Voltar para login
        </Link>
      </Button>

      <div className="w-full max-w-md space-y-8">
        {/* Logo e Título */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
              <Mail className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">
            Esqueceu sua senha?
          </h1>
          <p className="text-sm text-gray-300">
            Digite seu e-mail e enviaremos um link para redefinir sua senha.
          </p>
        </div>

        <Card className="w-full bg-white shadow-xl">
          <CardHeader className="space-y-3">
            <div className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold text-gray-900">Redefinir Senha</CardTitle>
              <CardDescription className="text-gray-500">
                Insira seu e-mail para receber o link de redefinição
              </CardDescription>
            </div>
          </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Email
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Digite seu email"
                          type="email"
                          className="h-11 pl-10"
                          {...field}
                        />
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <Button
                  type="submit"
                  className="w-full h-11 bg-black hover:bg-gray-800 text-white font-medium"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? "Enviando..."
                    : "Enviar link de redefinição"}
                </Button>

                <div className="text-center">
                  <Button variant="link" className="text-sm text-blue-600 hover:text-blue-800" asChild>
                    <Link href="/authentication">
                      Lembrou sua senha? Faça login
                    </Link>
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
