import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data: news } = await supabase
    .from("news")
    .select("title, content, image_url, published_at")
    .eq("slug", decodeURIComponent(slug))
    .single();

  if (!news) return { title: "خبر غير موجود | يلا شوت نيو" };

  return {
    title: `${news.title} | يلا شوت نيو`,
    description: news.content?.substring(0, 160) || "أخبار رياضية حصرية",
    alternates: {
      canonical: `https://yallashootnew.com/news/${slug}`,
    },
    openGraph: {
      title: news.title,
      description: news.content?.substring(0, 160),
      url: `https://yallashootnew.com/news/${slug}`,
      type: "article",
      publishedTime: news.published_at,
      images: news.image_url ? [{ url: news.image_url }] : [],
    },
  };
}

function NewsArticleStructuredData({ news }: { news: any }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: news.title,
    image: news.image_url ? [news.image_url] : [],
    datePublished: news.published_at,
    dateModified: news.updated_at || news.published_at,
    author: {
      "@type": "Organization",
      name: "يلا شوت نيو",
      url: "https://yallashootnew.com",
    },
    publisher: {
      "@type": "Organization",
      name: "يلا شوت نيو",
      logo: {
        "@type": "ImageObject",
        url: "https://yallashootnew.com/icon-192.png",
      },
    },
    description: news.content?.substring(0, 200),
    url: `https://yallashootnew.com/news/${news.slug}`,
    inLanguage: "ar",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://yallashootnew.com/news/${news.slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export default async function NewsDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: news } = await supabase
    .from("news")
    .select("*")
    .eq("slug", decodeURIComponent(slug))
    .single();

  if (!news) {
    notFound();
  }

  const dateString = new Date(news.published_at).toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Africa/Cairo"
  });

  const sanitizedContent = DOMPurify.sanitize(news.content || "التفاصيل غير متاحة حالياً.");

  return (
    <div className="container mx-auto px-4 py-8 flex-1 max-w-4xl">
      <NewsArticleStructuredData news={news} />

      <nav aria-label="breadcrumb" className="text-sm font-tajawal text-[var(--color-text-muted)] mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-accent)]">الرئيسية</Link>
        <span>/</span>
        <Link href="/news" className="hover:text-[var(--color-accent)]">الأخبار</Link>
        <span>/</span>
        <span className="text-[var(--color-text-primary)] line-clamp-1">{news.title}</span>
      </nav>

      <article>
        <header className="mb-8">
          <h1 className="text-2xl md:text-4xl font-bold font-tajawal mb-4 leading-tight text-[var(--color-text-primary)]">
            {news.title}
          </h1>
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <time dateTime={news.published_at}>{dateString}</time>
            {news.source && <span>• {news.source}</span>}
          </div>
        </header>

        {news.image_url && (
          <div className="w-full h-[300px] md:h-[500px] relative rounded-3xl overflow-hidden mb-8 shadow-[var(--shadow-card)]">
            <Image
              src={news.image_url}
              alt={news.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
              priority
              unoptimized={news.image_url.startsWith("http")}
            />
          </div>
        )}

        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-3xl p-6 md:p-10 shadow-[var(--shadow-elevated)]">
          <div 
            className="text-lg leading-relaxed text-[var(--color-text-secondary)] font-tajawal whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </div>
      </article>
    </div>
  );
}
