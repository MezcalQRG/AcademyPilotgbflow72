
import { getAcademyPhotos } from "@/app/actions";
import LocatorAssemble from "@/components/locator/LocatorAssemble";

export default async function LocatorPage() {
  const photos = await getAcademyPhotos("310 S Glendora Ave West Covina 91790");

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black overflow-x-hidden">
      <LocatorAssemble photoUrls={photos} />
    </main>
  );
}
