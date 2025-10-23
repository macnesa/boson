import "./globals.css";
import Navbar from "../components/organisms/Navbar";
import Footer from "../components/organisms/Footer";
import Providers from "./providers";

export const metadata = {
  title: "BOSON COLLECTIVE | Social Media Agency",
  description: "Transforming signals into stories. We turn chaos into meaning through creative digital experiences.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-100 min-h-screen">
        <Providers>
          {/* <Navbar /> */}
          {/* <main className="pt-16"> */}
            {children}
          {/* </main> */}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
