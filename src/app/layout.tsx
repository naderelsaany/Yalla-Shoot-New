import type { Metadata, Viewport } from "next";
import { Cairo, Tajawal } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LiveScoreTicker from "@/components/LiveScoreTicker";
import LiveScoreBanner from "@/components/LiveScoreBanner";
import { supabase } from "@/lib/supabase";
import { unstable_cache } from "next/cache";
import { News } from "@/types/database";
import Script from "next/script";
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

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yalla-shoot-new.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  manifest: '/manifest.json',
  title: {
    default: "يلا شوت نيو | بث مباشر مباريات اليوم بدون تقطيع Yalla Shoot",
    template: "%s | يلا شوت نيو",
  },
  description: "يلا شوت نيو - تابع مباريات اليوم بث مباشر بدون تقطيع، نتائج المباريات لحظة بلحظة، أهداف اليوم، ترتيب الدوريات، وأحدث الأخبار الرياضية. تغطية حصرية لكأس العالم 2026، دوري أبطال أوروبا، الدوري الإنجليزي، الدوري المصري، والدوري السعودي.",
  keywords: ["يلا شوت", "يلا شوت نيو", "يلا شوت الجديد", "بدون تقطيع", "بجودة HD", "مباشر جوال", "بث مباشر", "مباريات اليوم", "مباريات اليوم بث مباشر", "جدول مباريات اليوم", "يلا شوت بث مباشر مباريات اليوم بدون تقطيع", "نتائج مباريات اليوم", "كأس العالم", "كأس العالم 2026", "اهداف اليوم", "yalla shoot", "yalla shoot new", "koora live", "كورة لايف", "دوري ابطال اوروبا", "الدوري الانجليزي", "الدوري المصري", "الدوري السعودي", "ريال مدريد", "برشلونة", "الاهلي", "الزمالك", "الاهلي اليوم", "الزمالك اليوم", "ليفربول", "مانشستر سيتي"],
  category: "sports",
  authors: [{ name: "يلا شوت نيو" }],
  creator: "يلا شوت نيو",
  publisher: "يلا شوت نيو",
  other: {
    'application-name': 'يلا شوت نيو',
  },
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
      url: baseUrl,
      siteName: "يلا شوت نيو",
      title: "يلا شوت نيو | Yalla Shoot New",
      description: "تابع مباريات اليوم بث مباشر وتغطية حصرية لبطولة كأس العالم.",
    },
  other: {
    'og:site_name': 'يلا شوت نيو',
  },
  twitter: {
    card: "summary_large_image",
    title: "يلا شوت نيو | مباريات اليوم وكأس العالم",
    description: "بث مباشر لمباريات اليوم وأحدث الأخبار وتغطية كأس العالم.",
    creator: "@yallashootnew",
  },
  verification: {
    google: "cNHfGJiXXVT2uaJ8q7mofplDpWfTNvatP1Sqsz6syiU",
  },
  alternates: {
    canonical: baseUrl,
    languages: {
      'ar': baseUrl,
    },
    types: {
      'application/rss+xml': `${baseUrl}/rss.xml`,
    },
  },
};

function StructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yalla-shoot-new.vercel.app";
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: "يلا شوت نيو",
        alternateName: "Yalla Shoot New",
        url: baseUrl,
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/icon-512.png`,
          width: 512,
          height: 512,
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
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: "يلا شوت نيو",
        alternateName: "Yalla Shoot New",
        description: "منصة رياضية عربية متخصصة في بث المباريات والأخبار الرياضية",
        publisher: {
          "@id": `${baseUrl}/#organization`,
        },
        inLanguage: "ar",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${baseUrl}/search?q={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }
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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-2P6S4QFBJ2"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-2P6S4QFBJ2');
          `}
        </Script>
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
