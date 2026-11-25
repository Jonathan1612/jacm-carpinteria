"use client";

import { deletePhoto } from "@/lib/actions";

export function DeletePhotoButton({ id }: { id: string }) {
  return (
    <form action={deletePhoto}>
      <input type="hidden" name="id" value={id} />
      <button
        className="btn btn-danger btn-small"
        type="submit"
        onClick={(event) => {
          if (!window.confirm("¿Quitar esta foto de tu página?")) {
            event.preventDefault();
          }
        }}
      >
        Quitar
      </button>
    </form>
  );
}
