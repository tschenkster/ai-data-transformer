import { useStartPage } from '@/hooks/use-start-page';
import { HumorCard } from '@/components/start-page/HumorCard';
import { ShuffleButton } from '@/components/start-page/ShuffleButton';
import { PrimaryCTA } from '@/components/start-page/PrimaryCTA';
import { ErrorFallback } from '@/components/start-page/ErrorFallback';
import { QuietStart } from '@/components/start-page/QuietStart';
import { QuietToggle } from '@/components/start-page/QuietToggle';

export default function Start() {
  const {
    state,
    items,
    currentItem,
    locale,
    quietMode,
    onShuffle,
    onQuietToggle,
    getLocalizedContent,
    fallback
  } = useStartPage();

  if (state === 'quiet_mode') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          {/* Top greeting */}
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground">
              Welcome back 👋 — spreadsheets are safe with us today.
            </p>
          </div>

          {/* Quiet mode card */}
          <div className="mb-8">
            <QuietStart locale={locale} />
          </div>

          {/* Primary CTA */}
          <div className="text-center mb-6">
            <PrimaryCTA locale={locale} />
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            <QuietToggle 
              onClick={onQuietToggle} 
              locale={locale} 
              quietMode={quietMode} 
            />
          </div>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          {/* Top greeting */}
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground">
              Welcome back 👋 — spreadsheets are safe with us today.
            </p>
          </div>

          {/* Error fallback */}
          <div className="mb-8">
            <ErrorFallback message={fallback} locale={locale} />
          </div>

          {/* Primary CTA */}
          <div className="text-center mb-6">
            <PrimaryCTA locale={locale} />
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            <QuietToggle 
              onClick={onQuietToggle} 
              locale={locale} 
              quietMode={quietMode} 
            />
          </div>
        </div>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-64 mx-auto"></div>
              <div className="h-32 bg-muted rounded max-w-md mx-auto"></div>
              <div className="h-12 bg-muted rounded w-48 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Top greeting */}
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground">
            Welcome back 👋 — spreadsheets are safe with us today.
          </p>
        </div>

        {/* Humor card */}
        {currentItem && (
          <div className="mb-8">
            <HumorCard 
              item={currentItem} 
              localizedContent={getLocalizedContent(currentItem)} 
            />
          </div>
        )}

        {/* Primary CTA */}
        <div className="text-center mb-6">
          <PrimaryCTA locale={locale} />
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 flex-wrap">
          <ShuffleButton 
            onClick={onShuffle} 
            locale={locale} 
            disabled={items.length <= 1}
          />
          <QuietToggle 
            onClick={onQuietToggle} 
            locale={locale} 
            quietMode={quietMode} 
          />
        </div>
      </div>
    </div>
  );
}