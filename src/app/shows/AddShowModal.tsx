import { AddMediaModal } from '@/components/AddMediaModal';
import { useAlert } from '@/hooks/useAlert';
import { useRefreshShow } from '@/hooks/useRefresh';
import { TMDBTvShow } from '@/lib/themoviedb/tvshows';
import {
  ActionIcon,
  ModalProps,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  Text,
} from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { List, Plus } from 'lucide-react';
import { BaseShowCard } from './BaseShowCard';

type Props = { onAdd: () => void } & ModalProps;

export const AddShowModal = ({ onAdd, ...props }: Props) => {
  const { showSuccess, showError } = useAlert();
  const { refresh } = useRefreshShow();

  const { mutate: add, isPending: pendingAdd } = useMutation<
    { tvshowId: number },
    Error,
    { moviedb_id: number; name: string }
  >({
    mutationFn: async (tvshow) => {
      const response = await fetch('/api/tvshow', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ moviedb_id: tvshow.moviedb_id }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message);
      return { tvshowId: json.tvshow_id };
    },
    onSuccess: (data, tvshow) => {
      onAdd();
      refresh({ tvshowId: data.tvshowId, name: tvshow.name });
      showSuccess('Nice!', `You're now following ${tvshow.name}`);
    },
    onError(error) {
      showError('An error occurred', error.message);
    },
  });

  return (
    <AddMediaModal<TMDBTvShow>
      title={'Add Show'}
      {...props}
      queryKey={'searchShows'}
      queryFn={async (search) => {
        const params = new URLSearchParams({ q: search.trim() });
        const response = await fetch(`/api/tvshow/search?${params.toString()}`, { method: 'get' });
        if (response.ok) return await response.json();
        throw new Error((await response.json()).message);
      }}
      builder={(show) => (
        <BaseShowCard
          key={show.id}
          h={200}
          show={{
            ...show,
            moviedb_id: show.id,
            poster_slug: show.poster,
            backdrop_slug: show.backdrop,
          }}
          actions={
            <>
              <Popover width={'unset'}>
                <PopoverTarget>
                  <ActionIcon color={'blue'}>
                    <List />
                  </ActionIcon>
                </PopoverTarget>
                <PopoverDropdown>
                  <Text>{show.description}</Text>
                </PopoverDropdown>
              </Popover>
              <ActionIcon
                loaderProps={{ type: 'dots' }}
                loading={pendingAdd}
                onClick={() => add({ moviedb_id: show.id, name: show.name })}
              >
                <Plus />
              </ActionIcon>
            </>
          }
        />
      )}
    />
  );
};
