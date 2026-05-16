import { beforeEach, describe, expect, test, vi } from "vitest";

const storageApi = vi.hoisted(() => ({
  getDownloadURL: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
}));

vi.mock("firebase/storage", () => ({
  getDownloadURL: storageApi.getDownloadURL,
  ref: storageApi.ref,
  uploadBytes: storageApi.uploadBytes,
}));

describe("imageUpload", () => {
  beforeEach(() => {
    storageApi.getDownloadURL.mockReset();
    storageApi.ref.mockReset();
    storageApi.uploadBytes.mockReset();
    storageApi.ref.mockImplementation((storage, name) => ({ storage, name }));
    storageApi.uploadBytes.mockResolvedValue({ ref: { name: "uploaded" } });
    storageApi.getDownloadURL.mockResolvedValue("https://storage.example.com/image.jpg");
  });

  test("rejects missing files, SVG files, and oversized images", async () => {
    const { MAX_IMAGE_BYTES, assertImageFile } = await import("../utils/imageUpload");

    expect(() => assertImageFile(undefined)).toThrow("Choose an image before uploading.");
    expect(() =>
      assertImageFile(new File(["<svg></svg>"], "bad.svg", { type: "image/svg+xml" }))
    ).toThrow("Use a JPEG, PNG, WebP, or GIF image.");
    expect(() =>
      assertImageFile(
        new File([new Uint8Array(MAX_IMAGE_BYTES)], "large.jpg", {
          type: "image/jpeg",
        })
      )
    ).toThrow("Use an image smaller than 5 MB.");
  });

  test("uploads approved images under the signed-in user prefix", async () => {
    const { uploadUserImage } = await import("../utils/imageUpload");
    const file = new File(["image"], "Profile Photo!.jpg", { type: "image/jpeg" });

    const url = await uploadUserImage({
      storage: { name: "storage" },
      uid: "artist-uid",
      file,
    });

    expect(url).toBe("https://storage.example.com/image.jpg");
    expect(storageApi.ref).toHaveBeenCalledWith(
      { name: "storage" },
      expect.stringMatching(/^uploads\/artist-uid\/.+-Profile_Photo_.jpg$/)
    );
    expect(storageApi.uploadBytes).toHaveBeenCalledWith(
      expect.objectContaining({ name: expect.stringContaining("uploads/artist-uid/") }),
      file
    );
  });

  test("requires an authenticated uid before uploading", async () => {
    const { uploadUserImage } = await import("../utils/imageUpload");
    const file = new File(["image"], "profile.jpg", { type: "image/jpeg" });

    await expect(
      uploadUserImage({
        storage: { name: "storage" },
        uid: "",
        file,
      })
    ).rejects.toThrow("Sign in before uploading images.");
  });
});
