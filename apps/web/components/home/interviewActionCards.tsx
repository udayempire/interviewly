import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

interface InterviewActionCardsProps {
  title: string;
  description: string;
  buttonDescription: string;
  icon: LucideIcon;
  onClick: () => void;
  featured?: boolean;
}

export const InterviewActionCards = ({
  title,
  description,
  buttonDescription,
  icon: Icon,
  onClick,
  featured = false,
}: InterviewActionCardsProps) => {
  return (
    <article className={`group flex min-h-44 flex-col justify-between border p-4 sm:p-5 ${featured ? "border-[#d6b458] bg-[#f7e7ab] dark:border-[#7b6420] dark:bg-[#342f1b]" : "border-[#dfddd3] bg-[#fffdf8] dark:border-[#3a3934] dark:bg-[#20201e]"}`}> 
      <div>
        <div className={`flex h-8 w-8 items-center justify-center ${featured ? "bg-[#20201e] text-[#f8d04c]" : "border border-[#d8d5ca] text-[#625b45]"}`}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
        </div>
        <h3 className="mt-4 text-base font-semibold tracking-[-0.03em] text-[#20201e] dark:text-[#f4f1e8]">{title}</h3>
        <p className="mt-1.5 max-w-md text-[13px] leading-5 text-[#625f57] dark:text-[#c0bdb3]">{description}</p>
      </div>
      <button
        onClick={onClick}
        className="mt-4 flex w-fit items-center gap-2 text-[13px] font-semibold text-[#20201e] transition-opacity hover:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d39c13] dark:text-[#f4f1e8]"
      >
        {buttonDescription}
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </button>
    </article>
  );
};
