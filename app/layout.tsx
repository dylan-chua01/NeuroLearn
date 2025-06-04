import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { ClerkProvider } from "@clerk/nextjs";
import Footer from "@/components/Footer";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata = {
  title: 'NeuroLearn',
  description: 'Your AI-powered learning companion',
  icons: {
    icon: '/icons/neuroLearn_logo.png',
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bricolage.variable} antialiased`}>
        <ClerkProvider appearance={{ variables: {colorPrimary: '#fe5933' }}}>
        <NavBar />
        {children}
        </ClerkProvider>
        <Footer />
      </body>
    </html>
  );
}
