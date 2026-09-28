import { Composition, Folder, Still } from "remotion";
import { PostCode, PostIntro, PostLayers, PostNetwork, PostPalettes, PostWinner } from "./posts";
import { LAYERS_DURATION, LayersReel } from "./reels/LayersReel";
import { QUICKSTART_DURATION, QuickstartReel } from "./reels/QuickstartReel";
import { TRACKING_DURATION, TrackingReel } from "./reels/TrackingReel";
import { POST, REEL } from "./theme";

/**
 * Every deliverable, by the id `npm run render` uses for its filename.
 * Wall posts are stills; reels are videos.
 */
export function Root() {
  return (
    <>
      <Folder name="Wall">
        <Still id="post-01-intro" component={PostIntro} {...POST} />
        <Still id="post-02-code" component={PostCode} {...POST} />
        <Still id="post-03-winner" component={PostWinner} {...POST} />
        <Still id="post-04-network" component={PostNetwork} {...POST} />
        <Still id="post-05-palettes" component={PostPalettes} {...POST} />
        <Still id="post-06-layers" component={PostLayers} {...POST} />
      </Folder>
      <Folder name="Reels">
        <Composition
          id="reel-01-quickstart"
          component={QuickstartReel}
          durationInFrames={QUICKSTART_DURATION}
          {...REEL}
        />
        <Composition
          id="reel-02-tracking"
          component={TrackingReel}
          durationInFrames={TRACKING_DURATION}
          {...REEL}
        />
        <Composition
          id="reel-03-layers"
          component={LayersReel}
          durationInFrames={LAYERS_DURATION}
          {...REEL}
        />
      </Folder>
    </>
  );
}
