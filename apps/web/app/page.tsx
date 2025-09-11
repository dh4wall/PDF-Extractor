"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { UploadCloud, FileText, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const c1 = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const i1 = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#d5c5ff,transparent)]"></div>
      </div>
      
      <div className="container mx-auto max-w-5xl px-4">
        <motion.div
          className="flex min-h-screen flex-col justify-center"
          initial="hidden"
          animate="visible"
          variants={c1}
        >
          <div className="py-24 text-center">
            <motion.h1 
              className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl"
              variants={i1}
            >
              The Modern PDF Invoice Dashboard
            </motion.h1>
            <motion.p 
              className="mx-auto mt-4 max-w-xl text-xl text-muted-foreground"
              variants={i1}
            >
              Effortlessly upload PDF invoices, extract data with AI, and manage your records in a seamless, unified dashboard.
            </motion.p>
            <motion.div 
              className="mt-8 flex justify-center gap-4"
              variants={i1}
            >
              <Link href="/dashboard" passHref>
                <Button size="lg">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>

          <motion.div 
            className="grid gap-8 md:grid-cols-2"
            variants={c1}
          >
            <motion.div variants={i1}>
              <Card className="h-full transition-all hover:border-primary/60 hover:shadow-lg">
                <CardHeader>
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                      <UploadCloud className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-center">Upload & Extract</CardTitle>
                  <CardDescription className="text-center">
                    Use AI-powered Gemini or Groq models to extract invoice data instantly.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Link href="/dashboard" className="w-full">
                    <Button className="w-full">Go to Dashboard</Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
            
            <motion.div variants={i1}>
              <Card className="h-full transition-all hover:border-primary/60 hover:shadow-lg">
                <CardHeader>
                   <div className="mb-4 flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-center">Manage Invoices</CardTitle>
                  <CardDescription className="text-center">
                    View, edit, and search all your extracted invoice records in one place.
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Link href="/invoices" className="w-full">
                    <Button variant="secondary" className="w-full">View All Invoices</Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="py-16 text-center text-sm text-muted-foreground"
            variants={i1}
          >
            Simplify Invoices, Amplify Efficiency
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}