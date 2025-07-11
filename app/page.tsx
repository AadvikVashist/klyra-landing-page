"use client"

import AsciiExtrudedSvg from "@/components/AsciiExtrudedSvg";

export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen pr-14"> 
      <AsciiExtrudedSvg src="/logo.svg" depth={75} fgColor="#c87b36" cameraNudge={[0, 0, 0]} />
    </div>
  );
}
