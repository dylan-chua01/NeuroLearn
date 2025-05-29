import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn, getSubjectColor } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Clock, BookOpen, Calendar } from "lucide-react";

interface CompanionsListProps {
  title: string;
  companions?: Companion[];
  classNames?: string
}

const CompanionsList = ({ title, companions, classNames }: CompanionsListProps) => {
  return (
    <article className={cn('companion-list space-y-6', classNames)}>
      {/* Enhanced Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-3xl bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Continue your learning journey
          </p>
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm bg-white dark:bg-gray-900">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-800">
            <TableRow className="hover:bg-gray-100 dark:hover:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
              <TableHead className="text-lg font-semibold text-gray-700 dark:text-gray-300 w-2/3 py-4">
                Lessons
              </TableHead>
              <TableHead className="text-lg font-semibold text-gray-700 dark:text-gray-300 py-4">
                Subject
              </TableHead>
              <TableHead className="text-lg font-semibold text-gray-700 dark:text-gray-300 text-right py-4">
                Duration
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companions?.map(({ id, subject, name, topic, duration }) => (
              <TableRow 
                key={id} 
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <TableCell className="py-6">
                  <Link href={`/companions/${id}`} className="block group">
                    <div className="flex items-center gap-4">
                      {/* Enhanced Icon Container */}
                      <div 
                        className="size-16 flex items-center justify-center rounded-xl shadow-md group-hover:scale-105 transition-transform duration-200 max-md:hidden relative overflow-hidden" 
                        style={{ backgroundColor: getSubjectColor(subject) }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                        <Image 
                          src={`/icons/${subject}.svg`} 
                          alt={subject} 
                          width={28} 
                          height={28}
                          className="relative z-10"
                        />
                      </div>
                      
                      {/* Enhanced Content */}
                      <div className="flex flex-col gap-1">
                        <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                          {topic}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500 mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>Last session</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </TableCell>

                <TableCell className="py-6">
                  {/* Enhanced Desktop Subject Badge */}
                  <div className="max-md:hidden">
                    <span 
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium text-white shadow-md"
                      style={{ backgroundColor: getSubjectColor(subject) }}
                    >
                      <Image 
                        src={`/icons/${subject}.svg`} 
                        alt={subject} 
                        width={16} 
                        height={16}
                        className="mr-2"
                      />
                      {subject}
                    </span>
                  </div>
                  
                  {/* Enhanced Mobile Subject Icon */}
                  <div 
                    className="flex items-center justify-center rounded-lg w-10 h-10 shadow-md md:hidden"
                    style={{ backgroundColor: getSubjectColor(subject) }}
                  >
                    <Image 
                      src={`/icons/${subject}.svg`} 
                      alt={subject}
                      width={20}
                      height={20}
                    />
                  </div>
                </TableCell>

                <TableCell className="py-6">
                  {/* Enhanced Duration Display */}
                  <div className="flex items-center gap-2 justify-end">
                    <div className="text-right">
                      <div className="flex items-center gap-2 justify-end text-gray-900 dark:text-gray-100">
                        <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-xl font-semibold">
                          {duration}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 max-md:hidden">
                          mins
                        </span>
                      </div>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Empty State */}
      {(!companions || companions.length === 0) && (
        <div className="text-center py-12 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No sessions yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Start your first learning session to see it here
          </p>
        </div>
      )}
    </article>
  )
}

export default CompanionsList