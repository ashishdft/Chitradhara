import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

/** Wait for Firebase user token */
async function getToken(): Promise<string> {
  if (auth.currentUser) return auth.currentUser.getIdToken();

  return await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsub();
      reject(new Error("Not authenticated"));
    }, 5000);

    const unsub = onAuthStateChanged(
      auth,
      async (u) => {
        clearTimeout(timeout);
        unsub();
        if (!u) return reject(new Error("Not authenticated"));

        try {
          const t = await u.getIdToken();
          resolve(t);
        } catch (err) {
          reject(err);
        }
      },
      (err) => {
        clearTimeout(timeout);
        unsub();
        reject(err);
      }
    );
  });
}

/** Generic API fetch wrapper */
export async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const msg =
      (body && body.error) ||
      (body && body.message) ||
      body ||
      res.statusText;
    throw new Error(msg || "API error");
  }

  return body as T;
}

/* ----- Convenience wrappers ----- */
export function getMyVideos(url: string = "/api/videos") {
  return apiFetch(url);
}

export function getTrashedVideos() {
  return apiFetch("/api/videos/trash");
}

export function updateVideo(id: string, data: any) {
  return apiFetch(`/api/videos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function softDeleteVideo(id: string) {
  return apiFetch(`/api/videos/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "trash" }),
  });
}

export function restoreVideo(id: string) {
  return apiFetch(`/api/videos/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "restore" }),
  });
}

export function deleteVideo(id: string) {
  return apiFetch(`/api/videos/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "delete" }),
  });
}

export const moveToTrash = softDeleteVideo;
export const permanentDeleteVideo = deleteVideo;

export function getFreshSignedUrl(id: string) {
  return apiFetch(`/api/videos/${id}/signed-url`);
}

