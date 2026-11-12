import { AspectRatio, Modal } from '@mantine/core';

type Props = {
  /** YouTube video key. The modal is open while this is set. */
  videoKey: string | null;
  title: string;
  onClose: () => void;
};

/** Plays a trailer in a modal. The player loads only when opened, from YouTube's no-cookie domain. */
export const TrailerModal = ({ videoKey, title, onClose }: Props) => (
  <Modal opened={videoKey !== null} onClose={onClose} title={`${title} trailer`} size="xl" centered>
    {videoKey && (
      <AspectRatio ratio={16 / 9}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoKey)}?autoplay=1&rel=0`}
          title={`${title} trailer`}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </AspectRatio>
    )}
  </Modal>
);
