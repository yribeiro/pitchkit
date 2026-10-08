import { Composition, Folder, Still } from "remotion";
import { PostCode, PostIntro, PostLayers, PostNetwork, PostPalettes, PostWinner } from "./posts";
import {
  LinkedInFlow,
  LinkedInHexbin,
  LinkedInMomentum,
  LinkedInPositional,
  LinkedInVoronoi,
} from "./linkedin/LinkedInImage";
import { BALL_INTRO_DURATION, BallIntro } from "./ball/BallIntro";
import { WINNER_DURATION, WinnerAnimated } from "./WinnerAnimated";
import { CornerCover } from "./carousel/CornerCover";
import {
  SlideAll,
  SlideData,
  SlideFind,
  SlideFollow,
  SlideFreeze,
  SlideQuestions,
  SlideSave,
} from "./carousel/CornerSlides";
import { FINAL_DURATION, FinalReel } from "./reels/FinalReel";
import { LAYERS_DURATION, LayersReel } from "./reels/LayersReel";
import { LIVE_DURATION, LiveFinalReel } from "./reels/LiveFinalReel";
import { GOALS_DURATION, GoalsFinalReel } from "./reels/GoalsFinalReel";
import { NETS_DURATION, NetsFinalReel } from "./reels/NetsFinalReel";
import { NETWORKS_LOOP_DURATION, NetworksLoopReel } from "./reels/NetworksLoopReel";
import { NETWORKS_DURATION, NetworksReel } from "./reels/NetworksReel";
import { QUICKSTART_DURATION, QuickstartReel } from "./reels/QuickstartReel";
import { TRACKING_DURATION, TrackingReel } from "./reels/TrackingReel";
import {
  MOSAIC_PREVIEW,
  PROFILE_PREVIEW,
  WallMosaic,
  WallMosaicPreview,
  WallProfilePreview,
} from "./mosaic";
import { X_HEADER, XHeader } from "./header";
import { LINKEDIN, MOSAIC, POST, POST_VIDEO, REEL } from "./theme";

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
        <Still id="wall-mosaic" component={WallMosaic} {...MOSAIC} />
        <Still id="wall-mosaic-preview" component={WallMosaicPreview} {...MOSAIC_PREVIEW} />
        <Still id="x-header" component={XHeader} {...X_HEADER} />
        <Still id="wall-mosaic-profile" component={WallProfilePreview} {...PROFILE_PREVIEW} />
      </Folder>
      <Folder name="Carousels">
        <Still id="carousel-01-cover" component={CornerCover} {...POST} />
        <Still id="carousel-02-data" component={SlideData} {...POST} />
        <Still id="carousel-03-find" component={SlideFind} {...POST} />
        <Still id="carousel-04-freeze" component={SlideFreeze} {...POST} />
        <Still id="carousel-05-follow" component={SlideFollow} {...POST} />
        <Still id="carousel-06-all" component={SlideAll} {...POST} />
        <Still id="carousel-07-questions" component={SlideQuestions} {...POST} />
        <Still id="carousel-08-save" component={SlideSave} {...POST} />
      </Folder>
      <Folder name="LinkedIn">
        <Still id="linkedin-hexbin" component={LinkedInHexbin} {...LINKEDIN} />
        <Still id="linkedin-positional" component={LinkedInPositional} {...LINKEDIN} />
        <Still id="linkedin-voronoi" component={LinkedInVoronoi} {...LINKEDIN} />
        <Still id="linkedin-flow" component={LinkedInFlow} {...LINKEDIN} />
        <Still id="linkedin-momentum" component={LinkedInMomentum} {...LINKEDIN} />
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
          id="post-03-winner-animated"
          component={WinnerAnimated}
          durationInFrames={WINNER_DURATION}
          {...POST_VIDEO}
        />
        <Composition
          id="experiment-ball-intro"
          component={BallIntro}
          durationInFrames={BALL_INTRO_DURATION}
          {...REEL}
        />
        <Composition
          id="reel-03-layers"
          component={LayersReel}
          durationInFrames={LAYERS_DURATION}
          {...REEL}
        />
        <Composition
          id="reel-04-networks"
          component={NetworksReel}
          durationInFrames={NETWORKS_DURATION}
          {...REEL}
        />
        <Composition
          id="reel-04-networks-loop"
          component={NetworksLoopReel}
          durationInFrames={NETWORKS_LOOP_DURATION}
          {...REEL}
        />
        <Composition
          id="reel-05-wc-final"
          component={FinalReel}
          durationInFrames={FINAL_DURATION}
          {...REEL}
        />
        <Composition
          id="reel-06-live-final"
          component={LiveFinalReel}
          durationInFrames={LIVE_DURATION}
          {...REEL}
        />
        <Composition
          id="reel-06-network-final"
          component={NetsFinalReel}
          durationInFrames={NETS_DURATION}
          {...REEL}
        />
        <Composition
          id="reel-06-goals-final"
          component={GoalsFinalReel}
          durationInFrames={GOALS_DURATION}
          {...REEL}
        />
      </Folder>
    </>
  );
}
