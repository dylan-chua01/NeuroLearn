'use client';

import Image from "next/image";
import Link from "next/link";

interface CompanionComponentProps {
  id: string;
  name: string;
  topic: string;
  subject: string;
  duration: number;
  color: string;
  isOwner?: boolean;
}

const CompanionCard = ({
  id,
  name,
  topic,
  subject,
  duration,
  color,
  isOwner = false,
}: CompanionComponentProps) => {
  
  const handleDelete = async () => {
    const confirmed = confirm("Are you sure you want to delete this companion?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/companions/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        window.location.reload();
      } else {
        const { error } = await res.json();
        alert(`Failed to delete companion: ${error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Something went wrong while deleting');
    }
  };

  return (
    <article className="companion-card" style={{ backgroundColor: color }}>
      <div className="flex justify-between items-center mb-2">
        <div className="subject-badge">{subject}</div>

        <div className="flex items-center gap-2">

            <button
                    onClick={handleDelete}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all duration-200"
                    title="Delete companion"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
          
          <button className="companion-bookmark">
            <Image
              src="/icons/bookmark.svg"
              alt="bookmark"
              width={12.5}
              height={15}
            />
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-1">{name}</h2>
      <p className="text-sm mb-2">{topic}</p>

      <div className="flex items-center gap-2 mb-4">
        <Image
          src="/icons/clock.svg"
          alt="duration"
          width={13.5}
          height={13.5}
        />
        <p className="text-sm">{duration} minutes</p>
      </div>

      <Link href={`/companions/${id}`} className="w-full">
        <button className="btn-primary w-full justify-center">
          Launch Lesson
        </button>
      </Link>
    </article>
  );
};

export default CompanionCard;
