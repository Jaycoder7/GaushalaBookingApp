import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { KeyboardEvent, TouchEvent, useCallback, useEffect, useRef, useState } from 'react';
import photo01 from '../assets/gaushala/gaushala-01.jpg';
import photo02 from '../assets/gaushala/gaushala-02.jpg';
import photo03 from '../assets/gaushala/gaushala-03.jpg';
import photo04 from '../assets/gaushala/gaushala-04.jpg';
import photo05 from '../assets/gaushala/gaushala-05.jpg';
import photo06 from '../assets/gaushala/gaushala-06.jpg';
import photo07 from '../assets/gaushala/gaushala-07.jpg';
import photo08 from '../assets/gaushala/gaushala-08.jpg';
import photo09 from '../assets/gaushala/gaushala-09.jpg';
import photo10 from '../assets/gaushala/gaushala-10.jpg';
import photo11 from '../assets/gaushala/gaushala-11.jpg';
import photo12 from '../assets/gaushala/gaushala-12.jpg';

const photos = [
  { src: photo01, alt: 'Two cows resting together on the grass at the Gaushala.' },
  { src: photo02, alt: 'A visitor spending time with cows in the pasture.' },
  { src: photo03, alt: 'A close-up of a cow standing among the herd.' },
  { src: photo04, alt: 'A cow standing in the sunlight near the Gaushala shelter.' },
  { src: photo05, alt: 'A visitor sitting peacefully beside a resting cow.' },
  { src: photo06, alt: 'A cow walking through the Gaushala pasture.' },
  { src: photo07, alt: 'A visitor relaxing with a cow in the field.' },
  { src: photo08, alt: 'A visitor standing beside a brown cow in a green pasture.' },
  { src: photo09, alt: 'A visitor surrounded by the Gaushala cows.' },
  { src: photo10, alt: 'A herd of brown cows resting together in the field.' },
  { src: photo11, alt: 'Adult and young cows gathered in the pasture.' },
  { src: photo12, alt: 'Cows gathering together near a water trough.' },
];

const AUTOPLAY_DELAY = 6000;
const SWIPE_DISTANCE = 45;

export default function GaushalaCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const previous = useCallback(() => {
    setActiveIndex(current => (current - 1 + photos.length) % photos.length);
  }, []);

  const next = useCallback(() => {
    setActiveIndex(current => (current + 1) % photos.length);
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (paused || interacting || prefersReducedMotion) return undefined;

    const interval = window.setInterval(next, AUTOPLAY_DELAY);
    return () => window.clearInterval(interval);
  }, [interacting, next, paused]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      previous();
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      next();
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (touchStartX.current === null) return;
    const distance = touchStartX.current - (event.changedTouches[0]?.clientX ?? touchStartX.current);
    touchStartX.current = null;
    if (Math.abs(distance) < SWIPE_DISTANCE) return;
    if (distance > 0) next();
    else previous();
  };

  const activePhoto = photos[activeIndex];

  return (
    <section
      aria-label="Life at the Gaushala"
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="mx-auto mt-8 max-w-5xl px-4 outline-none focus-visible:ring-4 focus-visible:ring-saffron-200 sm:mt-10"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-saffron-600">A glimpse of our home</p>
          <h2 className="mt-1 text-2xl font-bold text-earth-900 sm:text-3xl">Life at the Gaushala</h2>
        </div>
        <p className="text-sm text-earth-700" aria-live="polite">
          Photo {activeIndex + 1} of {photos.length}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-earth-900 shadow-soft">
        <div className="relative h-[26rem] sm:h-[34rem]">
          <img
            aria-hidden="true"
            src={activePhoto.src}
            alt=""
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-35 blur-2xl"
          />
          <div className="absolute inset-0 bg-earth-900/25" />
          <div
            role="group"
            aria-roledescription="slide"
            aria-label={`${activeIndex + 1} of ${photos.length}`}
            className="relative flex h-full items-center justify-center"
          >
            <img
              key={activePhoto.src}
              src={activePhoto.src}
              alt={activePhoto.alt}
              loading={activeIndex === 0 ? 'eager' : 'lazy'}
              className="h-full w-full object-contain"
            />
          </div>

          <button
            type="button"
            onClick={previous}
            aria-label="Previous Gaushala photo"
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-earth-900/75 text-white shadow-lg backdrop-blur transition hover:bg-earth-900 focus:outline-none focus:ring-4 focus:ring-white/70 sm:left-5"
          >
            <ChevronLeft aria-hidden="true" size={26} />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next Gaushala photo"
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-earth-900/75 text-white shadow-lg backdrop-blur transition hover:bg-earth-900 focus:outline-none focus:ring-4 focus:ring-white/70 sm:right-5"
          >
            <ChevronRight aria-hidden="true" size={26} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-white/10 bg-earth-900 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-1 justify-center gap-1.5" aria-label="Choose a Gaushala photo">
            {photos.map((photo, index) => (
              <button
                type="button"
                key={photo.src}
                onClick={() => setActiveIndex(index)}
                aria-label={`Show photo ${index + 1}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                className={`h-2.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white ${
                  index === activeIndex ? 'w-7 bg-saffron-500' : 'w-2.5 bg-white/45 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPaused(current => !current)}
            aria-label={paused ? 'Play photo carousel' : 'Pause photo carousel'}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
          >
            {paused ? <Play aria-hidden="true" size={16} /> : <Pause aria-hidden="true" size={16} />}
          </button>
        </div>
      </div>
      <p className="mt-3 text-center text-sm text-earth-700">Use the arrows, swipe, or press the left and right arrow keys to explore.</p>
    </section>
  );
}
