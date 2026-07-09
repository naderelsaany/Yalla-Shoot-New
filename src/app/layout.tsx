import type { Metadata, Viewport } from "next";
import { Cairo, Tajawal } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LiveScoreTicker from "@/components/LiveScoreTicker";
import LiveScoreBanner from "@/components/LiveScoreBanner";
import { supabase } from "@/lib/supabase";
import { unstable_cache } from "next/cache";
import { News } from "@/types/database";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-arabic",
  display: "swap",
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0e17",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://yallashootnew.com"),
  title: {
    default: "يلا شوت نيو | Yalla Shoot New - بث مباشر لمباريات اليوم",
    template: "%s",
  },
  description: "تابع مباريات اليوم بث مباشر بدون تقطيع، أهداف المباريات، ترتيب الدوري، وأحدث الأخبار الرياضية على يلا شوت نيو. تغطية حصرية لبطولة كأس العالم، دوري أبطال أوروبا، والدوريات الكبرى.",
  keywords: ["يلا شوت", "يلا شوت نيو", "بث مباشر", "مباريات اليوم", "كأس العالم", "اهداف اليوم", "yalla shoot", "دوري ابطال اوروبا", "كورة لايف", "ريال مدريد", "برشلونة"],
  authors: [{ name: "يلا شوت نيو" }],
  creator: "يلا شوت نيو",
  publisher: "يلا شوت نيو",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ar_AR",
    url: "https://yallashootnew.com",
    siteName: "يلا شوت نيو",
    title: "يلا شوت نيو | Yalla Shoot New",
    description: "تابع مباريات اليوم بث مباشر وتغطية حصرية لبطولة كأس العالم.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "يلا شوت نيو - بث مباشر لمباريات اليوم",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "يلا شوت نيو | مباريات اليوم وكأس العالم",
    description: "بث مباشر لمباريات اليوم وأحدث الأخبار وتغطية كأس العالم.",
    images: ["/twitter-image.jpg"],
    creator: "@yallashootnew",
  },
  verification: {
    google: "cNHfGJiXXVT2uaJ8q7mofplDpWfTNvatP1Sqsz6syiU",
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL || "https://yallashootnew.com",
    languages: {
      'ar': process.env.NEXT_PUBLIC_BASE_URL || "https://yallashootnew.com",
    },
    types: {
      'application/rss+xml': `${process.env.NEXT_PUBLIC_BASE_URL || "https://yallashootnew.com"}/rss.xml`,
    },
  },
};

function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://yallashootnew.com/#organization",
        name: "يلا شوت نيو",
        alternateName: "Yalla Shoot New",
        url: "https://yallashootnew.com",
        logo: {
          "@type": "ImageObject",
          url: "https://yallashootnew.com/icon-192.png",
          width: 192,
          height: 192,
          caption: "يلا شوت نيو",
        },
        sameAs: [
          "https://twitter.com/yallashootnew",
          "https://facebook.com/yallashootnew",
        ],
        description: "منصة رياضية عربية متخصصة في بث المباريات والأخبار الرياضية",
      },
      {
        "@type": "WebSite",
        "@id": "https://yallashootnew.com/#website",
        url: "https://yallashootnew.com",
        name: "يلا شوت نيو",
        alternateName: "Yalla Shoot New",
        publisher: {
          "@id": "https://yallashootnew.com/#organization",
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://yallashootnew.com/matches?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
        inLanguage: "ar",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

const getNewsTitles = unstable_cache(
  async () => {
    const { data } = await supabase.from('news').select('title').order('published_at', { ascending: false }).limit(5);
    return data?.map((item: Pick<News, 'title'>) => item.title) || [];
  },
  ['news-titles-layout'],
  { revalidate: 60 } // cache for 60 seconds
);

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const newsHeadlines = await getNewsTitles();

  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`}>
      <head>
        {process.env.PLAYWRIGHT_TEST === 'true' && (
          <script dangerouslySetInnerHTML={{ __html: 'window.PLAYWRIGHT_TEST = true;' }} />
        )}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        )}
        <StructuredData />
      </head>
      <body className="antialiased selection:bg-[var(--color-accent)] selection:text-white min-h-screen flex flex-col bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
        <Header />
        <LiveScoreTicker news={newsHeadlines} />
        {children}
        <Footer />
        <LiveScoreBanner />
      </body>
    </html>
  );
}
