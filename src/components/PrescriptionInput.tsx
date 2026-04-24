import { useEffect, useRef, useState } from "react";
import { Upload, Sparkles, X, ImageIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  onSubmit: (input: string, imageBase64?: string) => void;
  loading: boolean;
  seedText?: string;
}

export function PrescriptionInput({ onSubmit, loading, seedText }: Props) {
  const [text, setText] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!seedText) return;
    const value = seedText.split(" · ")[0];
    setText(value);
  }, [seedText]);

  const handleFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageBase64(e.target?.result as string);
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const canSubmit = (text.trim().length > 0 || imageBase64) && consent && !loading;

  return (
    <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-[var(--shadow-card)] border border-border/50">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. Amoxicillin 500mg, three times a day for 7 days"
        rows={4}
        maxLength={1000}
        className="resize-none border-input/60 bg-background/60 rounded-2xl text-base placeholder:text-muted-foreground/70 focus-visible:ring-primary/40"
      />

      {imageName && (
        <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-primary-soft rounded-xl text-sm">
          <ImageIcon className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate flex-1 text-foreground/80">{imageName}</span>
          <button
            onClick={() => { setImageBase64(null); setImageName(null); if(fileRef.current) fileRef.current.value=""; }}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <label className="mt-5 flex items-start gap-3 cursor-pointer select-none group">
        <Checkbox
          checked={consent}
          onCheckedChange={(v) => setConsent(v === true)}
          className="mt-0.5"
          aria-label="I understand this tool is for educational purposes only"
        />
        <span className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/90 transition-colors">
          I understand this tool is for educational purposes only and does not replace professional medical advice. See our{" "}
          <Link to="/medical-disclaimer" className="text-primary hover:underline">
            medical disclaimer
          </Link>.
        </span>
      </label>

      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          className="rounded-2xl border-input/60 hover:bg-primary-soft hover:text-primary hover:border-primary/30 h-12"
        >
          <Upload className="w-4 h-4" />
          Upload prescription
        </Button>
        <Button
          onClick={() => onSubmit(text, imageBase64 || undefined)}
          disabled={!canSubmit}
          className="flex-1 h-12 rounded-2xl bg-[image:var(--gradient-primary)] hover:opacity-95 transition-opacity shadow-[var(--shadow-soft)] text-base font-medium"
        >
          <Sparkles className="w-4 h-4" />
          Explain My Prescription
        </Button>
      </div>
    </div>
  );
}
