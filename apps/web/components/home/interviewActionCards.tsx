import { CircleChevronRight } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardDescription, CardTitle } from "../ui/card"

interface interviewActionCardsProp {
    title: string,
    description: string,
    buttonDescription: string,
    onClick: () => void;
};

export const InterviewActionCards = ({ title, description, buttonDescription, onClick }: interviewActionCardsProp) => {
    return (
        <div>
            <Card className="p-4 px-6 bg-card rounded-sm hover:bg-accent transition-all duration-500 ease-out hover:px-7 hover:shadow-sm">
                <CardTitle className="pt-3 text-blue-600 dark:text-blue-400 font-semibold text-xl">{title}</CardTitle>
                <CardDescription className="font-medium">{description}</CardDescription>
                <Button onClick={onClick} className="bg-background hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:border-border cursor-pointer border-2 border-border font-semibold text-blue-500 dark:text-blue-400 flex justify-start items-center gap-2 rounded-lg w-fit mt-2 p-5 px-8">
                    <p>
                        {buttonDescription}
                    </p>
                    <CircleChevronRight fill="blue" className="text-white size-6" />
                </Button>
            </Card>
        </div>
    )
};