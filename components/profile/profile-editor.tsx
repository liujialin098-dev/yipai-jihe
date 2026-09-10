"use client";

import { Camera, LoaderCircle, Pencil, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { updateProfile } from "@/app/profile/actions";
import {
  displayNameInitial,
  normalizeDisplayName,
  profileAvatarPath,
  validateProfileAvatarFile,
} from "@/lib/profile/validation";
import { createClient } from "@/lib/supabase/client";

export function ProfileEditor({
  avatarUrl: initialAvatarUrl,
  displayName: initialDisplayName,
  userId,
}: {
  avatarUrl: string | null;
  displayName: string;
  userId: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const normalizedName = normalizeDisplayName(displayName);
    if (!normalizedName) {
      setMessage({ tone: "error", text: "昵称需要填写 1 到 20 个字符。" });
      return;
    }

    setPending(true);
    setMessage(null);
    let uploadedPath: string | undefined;
    try {
      if (file) {
        const validation = validateProfileAvatarFile(file);
        if (!validation.success) {
          setMessage({ tone: "error", text: validation.message });
          return;
        }
        const supabase = createClient();
        const userResult = await supabase.auth.getUser();
        if (userResult.data.user?.id !== userId) {
          throw new Error("unauthorized");
        }
        uploadedPath = profileAvatarPath(
          userId,
          crypto.randomUUID(),
          validation.extension,
        );
        const uploadResult = await supabase.storage
          .from("wardrobe-images")
          .upload(uploadedPath, file, {
            cacheControl: "31536000",
            contentType: file.type,
            upsert: false,
          });
        if (uploadResult.error) throw uploadResult.error;
      }

      const result = await updateProfile({
        displayName: normalizedName,
        ...(uploadedPath ? { avatarPath: uploadedPath } : {}),
      });
      if (result.status === "error") {
        if (uploadedPath) {
          await createClient()
            .storage.from("wardrobe-images")
            .remove([uploadedPath]);
        }
        setMessage({ tone: "error", text: result.message });
        return;
      }

      setDisplayName(normalizedName);
      setAvatarUrl(result.avatarUrl);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage({ tone: "success", text: result.message });
      if (detailsRef.current) detailsRef.current.open = false;
      router.refresh();
    } catch {
      if (uploadedPath) {
        await createClient()
          .storage.from("wardrobe-images")
          .remove([uploadedPath]);
      }
      setMessage({ tone: "error", text: "个人资料暂时无法保存，请稍后重试。" });
    } finally {
      setPending(false);
    }
  }

  const visibleAvatar = previewUrl ?? avatarUrl;

  return (
    <div className="profile-identity">
      <details ref={detailsRef} className="profile-edit">
        <summary className="profile-summary" aria-label="编辑个人资料">
          <span className="profile-display-avatar">
            {avatarUrl ? (
              // biome-ignore lint/performance/noImgElement: Private short-lived avatar URL must bypass the public optimization proxy.
              <img
                src={avatarUrl}
                alt="个人头像"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span>{displayNameInitial(initialDisplayName)}</span>
            )}
          </span>
          <span className="profile-edit-label">
            <Pencil className="size-3.5" aria-hidden="true" />
            编辑资料
          </span>
          <h1 className="app-page-title profile-display-name">
            {initialDisplayName}
          </h1>
        </summary>
        <form
          onSubmit={handleSubmit}
          className="profile-edit-form mt-5 rounded-3xl p-4"
        >
          <div className="flex items-end gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="profile-avatar group relative flex size-20 shrink-0 items-center justify-center rounded-full border-[3px] border-white bg-[#202124] text-2xl font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#202124]"
              aria-label="选择新头像"
            >
              {visibleAvatar ? (
                // biome-ignore lint/performance/noImgElement: Blob previews and short-lived authenticated URLs should not pass through the Next image proxy.
                <img
                  src={visibleAvatar}
                  alt="当前头像预览"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span>
                  {displayNameInitial(displayName || initialDisplayName)}
                </span>
              )}
              <span className="absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full border-2 border-white bg-[var(--fashion-lime)] text-[#202124] shadow-lg">
                <Camera className="size-3.5" aria-hidden="true" />
              </span>
            </button>
            <div className="min-w-0 flex-1 pb-1">
              <label
                htmlFor="profile-display-name"
                className="profile-privacy text-xs font-medium"
              >
                昵称
              </label>
              <input
                id="profile-display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={20}
                className="mt-1 h-11 w-full rounded-[1rem] border border-[var(--hairline)] bg-[var(--surface-solid)] px-3 text-sm font-semibold text-[var(--foreground)] outline-none transition focus:border-[var(--system-blue)] focus:ring-3 focus:ring-[color-mix(in_srgb,var(--system-blue)_16%,transparent)]"
              />
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              if (!selected) return;
              const validation = validateProfileAvatarFile(selected);
              if (!validation.success) {
                setFile(null);
                setMessage({ tone: "error", text: validation.message });
                return;
              }
              setFile(selected);
              setMessage(null);
            }}
          />
          <button
            type="submit"
            disabled={pending}
            className="motion-button mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--control-primary)] px-4 text-sm font-semibold text-[var(--control-primary-foreground)] disabled:opacity-50"
          >
            {pending ? (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            保存个人资料
          </button>
        </form>
      </details>
      {message ? (
        <output
          className={`mt-3 block rounded-[1rem] px-3 py-2.5 text-xs leading-5 ${message.tone === "success" ? "bg-[var(--success-surface)] text-[var(--success-text)]" : "bg-[var(--danger-surface)] text-[var(--danger-text)]"}`}
        >
          {message.text}
        </output>
      ) : null}
    </div>
  );
}
