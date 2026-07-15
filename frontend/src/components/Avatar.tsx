interface AvatarProps {
  profileImage?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  size?: number;
}

export default function Avatar({ profileImage, fullName, firstName, lastName, size = 40 }: AvatarProps) {
  const getInitials = () => {
    if (fullName) {
      return fullName
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    const first = firstName ? firstName.trim()[0] : '';
    const last = lastName ? lastName.trim()[0] : '';
    return (first + last).toUpperCase().slice(0, 2) || '?';
  };

  const getBackgroundColor = () => {
    const colors = ['#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#EC4899', '#14B8A6'];
    const name = fullName || firstName || 'User';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (profileImage && profileImage.trim() !== '') {
    return (
      <div
        className="rounded-full flex-shrink-0 bg-cover bg-center border border-slate-200 dark:border-zinc-800"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundImage: `url('${profileImage}')`,
        }}
      />
    );
  }

  return (
    <div
      className="rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white border border-slate-200 dark:border-zinc-800"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: getBackgroundColor(),
        fontSize: size > 40 ? '16px' : '14px',
      }}
    >
      {getInitials()}
    </div>
  );
}
