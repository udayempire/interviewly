export function LandingFooter() {
  return (
    <footer className="bg-[#20211f] px-5 py-8 text-[#e6e4da] sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-5 text-sm sm:flex-row sm:items-center">
        <p className="font-bold tracking-[-0.05em]">interviewlyy</p>
        <p className="text-xs text-[#aaa9a1]">
          Practice the conversation, not the script.
        </p>
        <div className="flex gap-5 text-xs text-[#aaa9a1]">
          {/* <a href="/signin">Sign in</a> */}
          <span>Launching soon</span>
          <a href="https://udayempire.me/contact"
            target="_blank"
            rel="noopener noreferrer"
          >Contact</a>
        </div>
      </div>
    </footer>
  );
}
