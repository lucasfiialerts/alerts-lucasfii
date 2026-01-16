"use client";

import { CreditCard, LogInIcon, LogOutIcon, MenuIcon, PackageIcon, Settings, ShoppingBasketIcon, UserIcon, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createBillingPortalSession } from "@/actions/create-billing-portal-session";
import { authClient } from "@/lib/auth-client";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
// Temporariamente desabilitado
// import { Cart } from "./cart";

export const Header = () => {
  const { data: session } = authClient.useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/"); // Redirect para página inicial após logout
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0d1621] border-b border-gray-800 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* === Logo === */}

          <Link href="/" className="flex items-center">
            <Image
              src="/navbar_logo.png"
              alt="Lucas FII Alerts"
              width={140}
              height={140}
              className="rounded-full"
                style={{ height: 60, width: 250, objectFit: 'cover'}}
                priority
            />
          </Link>

            {/* <Link href="/" className="flex items-center">
              <h1 className="text-white text-2xl font-bold font-boogaloo tracking-wide">Lucas FII <span className="font-space-grotesk text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-bold tracking-wider">Alerts  🚀</span></h1>
            </Link> */}


          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {/* <Link href="/" className="text-white hover:text-blue-400 px-4 py-2 text-sm font-semibold transition-all duration-300 hover:bg-blue-500/10 rounded-lg">
              Início
            </Link> */}

            <button
              onClick={() => scrollToSection('recursos')}
              className="group relative text-white hover:text-blue-400 px-5 py-2.5 text-sm font-bold transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-cyan-500/20 rounded-xl cursor-pointer border border-transparent hover:border-blue-400/30 hover:shadow-lg hover:shadow-blue-500/20"
            >
              <span className="relative z-10">Serviços</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 rounded-xl transition-all duration-300"></div>
            </button>

            <button
              onClick={() => scrollToSection('planos')}
              className="group relative text-white hover:text-blue-400 px-5 py-2.5 text-sm font-bold transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-cyan-500/20 rounded-xl cursor-pointer border border-transparent hover:border-blue-400/30 hover:shadow-lg hover:shadow-blue-500/20"
            >
              <span className="relative z-10">Planos</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 rounded-xl transition-all duration-300"></div>
            </button>

            <button
              onClick={() => scrollToSection('como-funciona')}
              className="group relative text-white hover:text-blue-400 px-5 py-2.5 text-sm font-bold transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-cyan-500/20 rounded-xl cursor-pointer border border-transparent hover:border-blue-400/30 hover:shadow-lg hover:shadow-blue-500/20"
            >
              <span className="relative z-10">Sobre</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 rounded-xl transition-all duration-300"></div>
            </button>

            <Link
              href="/contato"
              className="group relative text-white hover:text-blue-400 px-5 py-2.5 text-sm font-bold transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-cyan-500/20 rounded-xl border border-transparent hover:border-blue-400/30 hover:shadow-lg hover:shadow-blue-500/20 inline-block"
            >
              <span className="relative z-10">Contato</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 rounded-xl transition-all duration-300"></div>
            </Link>


          </nav>

          {/* Right side - User menu */}
          <div className="flex items-center space-x-4">
            {session?.user ? (
              <div className="hidden lg:flex items-center space-x-4">
                {/* Dashboard Link */}
                <Link
                  href="/home"
                  className="text-white hover:text-blue-400 px-4 py-2 text-sm font-semibold transition-all duration-300 hover:bg-blue-500/10 rounded-lg"
                >
                  Dashboard
                </Link>

                {/* User dropdown with hover */}
                <div className="relative">
                  {/* User trigger */}
                  <div
                    className="flex items-center space-x-3 cursor-pointer"
                    onMouseEnter={() => setIsDropdownOpen(true)}
                  >
                    {/* <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-white" />
                    </div> */}
                    <span className="text-sm font-medium text-white">
                      Olá, {session?.user?.name?.split(" ")?.[0]}
                    </span>
                    <svg
                      className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Dropdown content */}
                  {isDropdownOpen && (
                    <div
                      className="absolute right-0 top-full mt-3 w-72 rounded-xl shadow-2xl border border-gray-700/50 z-50 backdrop-blur-sm"
                      style={{ backgroundColor: '#1a1a34' }}
                      onMouseEnter={() => setIsDropdownOpen(true)}
                      onMouseLeave={() => setIsDropdownOpen(false)}
                    >
                      {/* Arrow pointing up */}
                      <div className="absolute -top-2 right-6 w-4 h-4 border-l border-t border-gray-700/50 rotate-45" style={{ backgroundColor: '#1a1a34' }}></div>

                      {/* Content */}
                      <div className="p-6">
                        {/* User info */}
                        <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-lg border border-blue-500/20">
                          <Avatar className="h-12 w-12 ring-2 ring-blue-400/50">
                            <AvatarImage
                              src={session?.user?.image as string | undefined}
                            />
                            <AvatarFallback className="bg-blue-500/20 text-blue-300 font-semibold text-lg">
                              {session?.user?.name?.split(" ")?.[0]?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-base font-bold text-white truncate">{session?.user?.name}</span>
                            <span className="text-sm text-gray-300 truncate">
                              {session?.user?.email}
                            </span>
                          </div>
                        </div>

                        {/* Navigation Section */}
                        <div className="mb-6">
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Navegação</h3>
                          <div className="space-y-2">
                            <Button
                              variant="ghost"
                              className="w-full justify-start h-12 px-4 hover:bg-blue-500/20 hover:text-blue-300 transition-all duration-200 text-gray-200 cursor-pointer"
                              onClick={() => scrollToSection('recursos')}
                            >
                              <svg className="h-5 w-5 mr-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="text-sm font-medium">Serviços</span>
                            </Button>

                            <Button
                              variant="ghost"
                              className="w-full justify-start h-12 px-4 hover:bg-blue-500/20 hover:text-blue-300 transition-all duration-200 text-gray-200"
                              asChild
                            >
                              <Link href="/planos">
                                <svg className="h-5 w-5 mr-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-medium">Planos</span>
                              </Link>
                            </Button>

                            <Button
                              variant="ghost"
                              className="w-full justify-start h-12 px-4 hover:bg-blue-500/20 hover:text-blue-300 transition-all duration-200 text-gray-200"
                              asChild
                            >
                              <Link href="/contato">
                                <svg className="h-5 w-5 mr-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm font-medium">Contato</span>
                              </Link>
                            </Button>
                          </div>
                        </div>

                        {/* Account Section */}
                        <div className="border-t border-gray-700/50 pt-4">
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Conta</h3>

                          <Button
                            variant="ghost"
                            className="w-full justify-start h-12 px-4 hover:bg-green-500/20 hover:text-green-300 transition-all duration-200 mb-3 text-gray-200 cursor-pointer"
                            onClick={() => createBillingPortalSession()}
                          >
                            <CreditCard className="h-5 w-5 mr-3 text-green-400" />
                            <span className="text-sm font-medium">Gerenciar Assinatura</span>
                          </Button>

                          <Button
                            variant="ghost"
                            className="w-full justify-start h-12 px-4 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 text-gray-200 cursor-pointer"
                            onClick={handleSignOut}
                          >
                            <LogOutIcon className="h-5 w-5 mr-3 text-red-400" />
                            <span className="text-sm font-medium">Sair</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="hidden lg:flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  className="group relative bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white font-bold px-8 py-2.5 rounded-full hover:from-blue-600 hover:via-blue-700 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/50 hover:scale-105 border border-blue-400/20" 
                  asChild
                >
                  <Link href="/authentication" className="flex items-center gap-2">
                    <LogInIcon className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-300" />
                    <span>Entrar</span>
                  </Link>
                </Button>
                {/* <Button className="bg-white text-black hover:bg-gray-200" asChild>
                  <Link href="/authentication">Cadastrar</Link>
                </Button> */}
              </div>
            )}

            {/* Mobile menu button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-white hover:text-gray-300 hover:bg-gray-800">
                  <MenuIcon className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-80 bg-[#1a1a34] border-gray-800 [&>button]:text-white [&>button]:hover:text-gray-300">
                <SheetHeader className="pb-6">
                  <SheetTitle className="text-xl font-bold text-white">Menu</SheetTitle>
                </SheetHeader>

                <div className="px-2 space-y-6">
                  {/* Navigation Links */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Navegação</h3>

                    <Link href="/" className="flex items-center px-3 py-3 text-gray-200 hover:bg-blue-500/20 hover:text-blue-300 rounded-lg transition-all duration-200">
                      <svg className="w-5 h-5 mr-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span className="font-medium">Início</span>
                    </Link>

                    <button
                      onClick={() => scrollToSection('recursos')}
                      className="flex items-center px-3 py-3 text-gray-200 hover:bg-blue-500/20 hover:text-blue-300 rounded-lg transition-all duration-200 w-full text-left cursor-pointer"
                    >
                      <svg className="w-5 h-5 mr-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">Serviços</span>
                    </button>

                    <Link href="/planos" className="flex items-center px-3 py-3 text-gray-200 hover:bg-blue-500/20 hover:text-blue-300 rounded-lg transition-all duration-200">
                      <svg className="w-5 h-5 mr-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Planos</span>
                    </Link>

                    <button
                      onClick={() => scrollToSection('como-funciona')}
                      className="flex items-center px-3 py-3 text-gray-200 hover:bg-blue-500/20 hover:text-blue-300 rounded-lg transition-all duration-200 w-full text-left cursor-pointer"
                    >
                      <svg className="w-5 h-5 mr-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Sobre</span>
                    </button>


                    <Link href="/contato" className="flex items-center px-3 py-3 text-gray-200 hover:bg-blue-500/20 hover:text-blue-300 rounded-lg transition-all duration-200">
                      <svg className="w-5 h-5 mr-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">Contato</span>
                    </Link>


                  </div>

                  {/* User Section */}
                  {session?.user ? (
                    <>
                      <div className="border-t border-gray-700/50 pt-6">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Conta</h3>

                        <div className="flex items-center gap-3 mb-4 p-3 bg-blue-500/10 rounded-lg">
                          <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white truncate">{session?.user?.name}</h4>
                            <p className="text-sm text-gray-300 truncate">{session?.user?.email}</p>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          className="w-full justify-start mb-3 cursor-pointer text-gray-200 hover:bg-blue-500/20 hover:text-blue-300"
                          onClick={() => createBillingPortalSession()}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Gerenciar Assinatura
                        </Button>

                        <Button
                          variant="ghost"
                          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/20 cursor-pointer"
                          onClick={handleSignOut}
                        >
                          <LogOutIcon className="h-4 w-4 mr-2" />
                          Sair
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="border-t border-gray-700/50 pt-6">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Acesso</h3>

                      <div className="space-y-3">
                        <Button 
                          className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 hover:from-blue-600 hover:via-blue-700 hover:to-cyan-600 text-white font-bold py-6 rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 border border-blue-400/20" 
                          asChild
                        >
                          <Link href="/authentication" className="flex items-center justify-center gap-2">
                            <LogInIcon className="h-5 w-5" />
                            <span>Entrar</span>
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
