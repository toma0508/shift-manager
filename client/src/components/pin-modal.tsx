import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PinModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PinModal({
  isOpen,
  onSuccess,
  onCancel,
}: PinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Correct PIN (in a real app, this would be stored securely)
  const CORRECT_PIN = "1123";

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (pin.length !== 4) {
      setError("PINは4桁で入力してください");
      return;
    }

    setIsSubmitting(true);

    // Simulate slight delay for authentication
    setTimeout(() => {
      if (pin === CORRECT_PIN) {
        onSuccess();
      } else {
        setError("PINが間違っています");
        setPin("");
        setIsSubmitting(false);
      }
    }, 500);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(value);
    setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className="bg-white rounded-lg p-6 w-96 max-w-[90vw] shadow-2xl"
        onKeyDown={handleKeyDown}
      >
        <div className="text-center mb-6">
          <h2
            className="text-xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: "Noto Sans JP, sans-serif" }}
          >
            管理者認証
          </h2>
          <p
            className="text-sm text-gray-600"
            style={{ fontFamily: "Noto Sans JP, sans-serif" }}
          >
            4桁のPINを入力してください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              value={pin}
              onChange={handlePinChange}
              placeholder="****"
              className="text-center text-2xl tracking-widest"
              style={{ fontFamily: "monospace" }}
              maxLength={4}
              autoFocus
              data-testid="pin-input"
            />
            {error && (
              <p
                className="text-red-500 text-sm mt-2 text-center"
                style={{ fontFamily: "Noto Sans JP, sans-serif" }}
                data-testid="pin-error"
              >
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
              style={{ fontFamily: "Noto Sans JP, sans-serif" }}
              data-testid="pin-cancel"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={pin.length !== 4 || isSubmitting}
              className="flex-1"
              style={{ fontFamily: "Noto Sans JP, sans-serif" }}
              data-testid="pin-submit"
            >
              {isSubmitting ? "認証中..." : "OK"}
            </Button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <p
            className="text-xs text-gray-400"
            style={{ fontFamily: "Noto Sans JP, sans-serif" }}
          >
            デモ用PIN: 1123
          </p>
        </div>
      </div>
    </div>
  );
}
