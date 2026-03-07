import { getAcademyPhotos } from '@/app/actions';
import StoreAssemble from "@/components/store/StoreAssemble";

export default async function StorePage() {
  // Tactical Intelligence: Fetching live academy photos for the Armory background
  const photos = await getAcademyPhotos("310 S Glendora Ave West Covina 91790");

  return (
    <main className="min-h-screen bg-black overflow-x-hidden">
      <StoreAssemble photoUrls={photos} />
    </main>
  );
}
