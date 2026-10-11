import { useQueryClient } from "@tanstack/react-query";
import { useUpdateCurrentConsumer, type ConsumerProfileUpdateInput } from "@workspace/api-client-react";
import { saveConsumerProfile, useAuthStore } from "@/stores/authStore";
import { consumerQueryKey } from "./useConsumerSession";

export function useConsumerProfileUpdate() {
  const queryClient = useQueryClient();
  const mutation = useUpdateCurrentConsumer({ mutation: { retry: false } });
  return {
    isPending: mutation.isPending,
    update: async (data: ConsumerProfileUpdateInput) => {
      const expectedId = useAuthStore.getState().tokens?.userId;
      if (!expectedId) throw new Error("INVALID_SESSION");
      const profile = await mutation.mutateAsync({ data });
      if (!profile || profile.id !== expectedId || useAuthStore.getState().tokens?.userId !== expectedId) {
        throw new Error("INVALID_PROFILE");
      }
      await saveConsumerProfile(profile);
      queryClient.setQueryData(consumerQueryKey(expectedId), profile);
      return profile;
    },
  };
}
