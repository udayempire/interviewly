function GoogleMark() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.5h3.2c1.9-1.8 3.1-4.3 3.1-7.4Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.7-2.4l-3.2-2.5c-.9.6-2 .9-3.5.9-2.7 0-5-1.8-5.8-4.3H2.9v2.6A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.2 13.7a6 6 0 0 1 0-3.5V7.6H2.9a10 10 0 0 0 0 8.7l3.3-2.6Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.1c1.5 0 2.9.5 3.9 1.5l2.9-2.9A10 10 0 0 0 2.9 7.6l3.3 2.6C7 7.9 9.3 6.1 12 6.1Z"
      />
    </svg>
  );
}

function GithubMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 fill-current"
      viewBox="0 0 24 24"
    >
      <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.8.8.1-.6.4-1.1.7-1.3-2.3-.3-4.7-1.2-4.7-5.1 0-1.1.4-2.1 1-2.8-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1.1a9.5 9.5 0 0 1 5.1 0c1.9-1.4 2.7-1.1 2.7-1.1.5 1.4.2 2.4.1 2.7.7.7 1 1.7 1 2.8 0 4-2.4 4.8-4.7 5.1.4.3.7 1 .7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

export function SocialLoginButtons({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google`}
          type="button"
          className={`flex items-center justify-center gap-2 border border-[#8d8c85] bg-[#fffdf8] text-xs font-semibold transition-colors hover:border-[#20201e] hover:bg-[#f6f4ec] ${compact ? "h-9" : "h-10"}`}
        >
          <GoogleMark />
          Google
        </a>
        <button
          type="button"
          className={`flex items-center justify-center gap-2 border border-[#8d8c85] bg-[#fffdf8] text-xs font-semibold transition-colors hover:border-[#20201e] hover:bg-[#f6f4ec] ${compact ? "h-9" : "h-10"}`}
        >
          <GithubMark />
          GitHub
        </button>
      </div>
      <div className={`flex items-center gap-3 ${compact ? "py-1" : "py-1.5"}`}>
        <span className="h-px flex-1 bg-[#bdbbb3]" />
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
          or email
        </span>
        <span className="h-px flex-1 bg-[#bdbbb3]" />
      </div>
    </>
  );
}
