"use client";

import { Crisp } from "crisp-sdk-web";
import  { useEffect } from "react";

export default function CrispChat() {
  useEffect(() => {
    Crisp.configure("d9ef927a-7ae9-4a1c-a8dc-6d9181fbe3c1");
  }, []);

  return null;
}