import { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Link } from "react-router";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo/logo.jpg";

export function HeroSection({ slides, autoplay = true, autoplayInterval = 6 }) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    autoplay ? [Autoplay({ delay: autoplayInterval * 1000, stopOnInteraction: true })] : []
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback((api) => setSelectedIndex(api.selectedScrollSnap()), []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    emblaApi.on("select", onSelect);
  }, [emblaApi, onSelect]);

  if (!slides?.length) return null;

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, index) => (
            <div key={index} className="relative min-w-0 shrink-0 grow-0 basis-full">
              <div className="relative flex min-h-[70svh] items-center justify-center overflow-hidden bg-background px-6 py-24 sm:min-h-[80svh]">
                <img
                  src={logo}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-1/2 w-[140%] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.05]"
                />
                <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
                  <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={index === selectedIndex ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="font-heading text-4xl tracking-tight text-foreground sm:text-6xl"
                  >
                    {slide.title}
                  </motion.h1>
                  {slide.subtitle && (
                    <motion.p
                      initial={{ opacity: 0, y: 16 }}
                      animate={index === selectedIndex ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                      className="max-w-lg text-balance text-muted-foreground sm:text-lg"
                    >
                      {slide.subtitle}
                    </motion.p>
                  )}
                  {slide.ctaText && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={index === selectedIndex ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                    >
                      <Button asChild size="lg">
                        <Link to={slide.ctaLink || "/"}>{slide.ctaText}</Link>
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === selectedIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/40"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
