import { AppbarInterviewSession } from "@/components/interviewSession.tsx/appbarInterviewSession";
import { Participants } from "@/components/interviewSession.tsx/participants";

export default function InterviewPage() {
    return (
        <div>
            <AppbarInterviewSession />
            <div className="grid grid-cols-[65%_35%] min-h-screen bg-zinc-100">
                <div className="p-4">
                    <Participants />

                </div>
                <div className="bg-orange-100">
                    hello

                </div>
            </div>
        </div>
    )
}