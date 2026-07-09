import { supabase } from '@/lib/supabase';
import { News } from '@/types/database';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string }> }): Promise<Metadata> {
  const { page } = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yalla-shoot-new.vercel.app';
  const canonicalUrl = page && page !== '1' ? `${baseUrl}/news?page=${page}` : `${baseUrl}/news`;
  
  const pageTitle = page && page !== '1' ? `أخبار الرياضة - صفحة ${page}` : 'أحدث الأخبار الرياضية';
  const pageDesc = 'أحدث الأخبار الرياضية وتغطية حصرية لانتقالات اللاعبين، نتائج المباريات، دوري أبطال أوروبا، الدوري الإنجليزي، الدوري المصري والسعودي على يلا شوت نيو.';
  
  const prevUrl = page && parseInt(page) > 1
    ? (parseInt(page) - 1 === 1 ? `${baseUrl}/news` : `${baseUrl}/news?page=${parseInt(page) - 1}`)
    : undefined;
  const nextUrl = page ? `${baseUrl}/news?page=${parseInt(page) + 1}` : undefined;

  return {
    title: pageTitle,
    description: pageDesc,
    keywords: 'أخبار الرياضة, أخبار كرة القدم, انتقالات اللاعبين, أخبار الدوري الانجليزي, أخبار الأهلي, أخبار الزمالك, أخبار الاتحاد, أخبار الهلال, أخبار النصر, يلا شوت نيو',
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${pageTitle} | يلا شوت نيو`,
      description: pageDesc,
      url: canonicalUrl,
      type: 'website',
      images: [{ url: `${baseUrl}/icon-512.png`, width: 512, height: 512, alt: 'يلا شوت نيو' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDesc,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    other: {
      ...(prevUrl ? { 'prev': prevUrl } : {}),
      ...(nextUrl ? { 'next': nextUrl } : {}),
    },
  };
}

export const revalidate = 60; // ISR

function NewsBreadcrumbsStructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://yalla-shoot-new.vercel.app';
  const breadcrumbData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'الأخبار',
        item: `${baseUrl}/news`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
    />
  );
}

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const currentPage = parseInt(page || '1');
  const itemsPerPage = 12;
  const from = (currentPage - 1) * itemsPerPage;
  const to = from + itemsPerPage - 1;

  const { data: newsItems, count } = await supabase
    .from('news')
    .select('*', { count: 'exact' })
    .order('published_at', { ascending: false })
    .range(from, to);

  const totalPages = Math.ceil((count || 0) / itemsPerPage);

  return (
    <div className="container mx-auto px-4 py-8 flex-1">
      <NewsBreadcrumbsStructuredData />
      
      {/* Breadcrumbs */}
      <nav aria-label="breadcrumb" className="text-sm font-tajawal text-[var(--color-text-muted)] mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-[var(--color-accent)]">الرئيسية</Link>
        <span>/</span>
        <span className="text-[var(--color-text-primary)]">الأخبار</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold font-tajawal mb-2 tracking-tight">
          أحدث <span className="text-[var(--color-accent)]">الأخبار</span>
        </h1>
        <p className="text-[var(--color-text-secondary)]">تغطية حصرية على مدار الساعة لجميع الأحداث الرياضية.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {newsItems && newsItems.length > 0 ? (
          newsItems.map((news: News) => {
            const dateObj = new Date(news.published_at);
            const dateString = dateObj.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Africa/Cairo' });
            
            return (
              <Link href={`/news/${news.slug}`} key={news.id} className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-all hover:-translate-y-1 flex flex-col group">
                {news.image_url ? (
                  <div className="h-48 relative bg-black overflow-hidden">
                    <Image 
                      src={news.image_url} 
                      alt={news.title} 
                      fill
                      className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-tr from-[var(--color-bg-elevated)] to-[var(--color-accent)] opacity-20"></div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <span className="text-xs text-[var(--color-text-muted)] mb-2">{dateString}</span>
                  <h3 className="text-lg font-bold font-tajawal text-[var(--color-text-primary)] leading-tight mb-3 group-hover:text-[var(--color-accent)] transition-colors">
                    {news.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3 mb-4 flex-1">
                    {news.content}
                  </p>
                  <span className="text-sm font-bold text-[var(--color-accent)] mt-auto self-start">
                    اقرأ التفاصيل ←
                  </span>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)] rounded-2xl border border-[var(--color-border-subtle)]">
            لا توجد أخبار حالياً
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-12 font-tajawal">
          {currentPage > 1 && (
            <Link 
              href={`/news?page=${currentPage - 1}`}
              className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] px-6 py-2 rounded-xl hover:bg-[var(--color-accent)] hover:text-white transition-colors shadow-[var(--shadow-card)]"
            >
              الصفحة السابقة
            </Link>
          )}
          
          <span className="flex items-center text-[var(--color-text-secondary)]">
            صفحة {currentPage} من {totalPages}
          </span>

          {currentPage < totalPages && (
            <Link 
              href={`/news?page=${currentPage + 1}`}
              className="bg-[var(--color-accent)] text-white px-6 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-[var(--shadow-card)]"
            >
              الصفحة التالية
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
