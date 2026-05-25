import { ActionIcon, type ModalProps, Popover, PopoverDropdown, PopoverTarget, Text } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { List, Plus } from 'lucide-react';
import { AddMediaModal } from '@/components/AddMediaModal';
import { QueryKey } from '@/components/QueryProvider';
import { useAlert } from '@/hooks/useAlert';
import { useRefreshShow } from '@/hooks/useRefresh';
import { apiRoutes } from '@/lib/routes';
import type { TMDBTvShow } from '@/lib/themoviedb/tvshows';
import { BaseShowCard } from './BaseShowCard';

type Props = ModalProps;

export const AddShowModal = (props: Props) => {
  const { showSuccess, showError } = useAlert();
  const { refresh } = useRefreshShow();

  const queryClient = useQueryClient();
  const { mutate: add, isPending: pendingAdd } = useMutation<
    { tvshowUuid: string },
    Error,
    { moviedb_id: number; name: string }
  >({
    mutationFn: async (tvshow) => {
      const response = await fetch(apiRoutes.tvshow, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ moviedb_id: tvshow.moviedb_id }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message);
      return { tvshowUuid: json.tvshow_uuid as string };
    },
    onSuccess: (data, tvshow) => {
      refresh({ tvshowUuid: data.tvshowUuid, name: tvshow.name });
      showSuccess({ title: 'Nice!', message: `You're now following ${tvshow.name}` });
      queryClient.invalidateQueries({ queryKey: [QueryKey.getShows] });
    },
    onError(error) {
      showError({ title: 'An error occurred', message: error.message });
    },
  });

  return (
    <AddMediaModal<TMDBTvShow>
      title={'Add Show'}
      {...props}
      queryKey={QueryKey.searchShows}
      queryFn={async (search) => {
        const params = new URLSearchParams({ q: search.trim() });
        const response = await fetch(apiRoutes.tvshowSearch(params), { method: 'get' });
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
                    <List size={'20'} />
                  </ActionIcon>
                </PopoverTarget>
                <PopoverDropdown>
                  <Text>{show.description}</Text>
                </PopoverDropdown>
              </Popover>
              <ActionIcon loading={pendingAdd} onClick={() => add({ moviedb_id: show.id, name: show.name })}>
                <Plus size={'20'} />
              </ActionIcon>
            </>
          }
        />
      )}
    />
  );
};
