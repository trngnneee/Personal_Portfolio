import {
  AcademicCapIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  CommandLineIcon,
  CubeIcon,
  HeartIcon,
  HomeIcon,
  LinkIcon,
  NewspaperIcon,
  PhotoIcon,
  RectangleGroupIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import {
  AcademicCapIcon as AcademicCapIconSolid,
  BriefcaseIcon as BriefcaseIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  CommandLineIcon as CommandLineIconSolid,
  CubeIcon as CubeIconSolid,
  HeartIcon as HeartIconSolid,
  HomeIcon as HomeIconSolid,
  LinkIcon as LinkIconSolid,
  NewspaperIcon as NewspaperIconSolid,
  PhotoIcon as PhotoIconSolid,
  RectangleGroupIcon as RectangleGroupIconSolid,
  UserCircleIcon as UserCircleIconSolid,
} from "@heroicons/react/24/solid";
import type { ComponentType, SVGProps } from "react";
import type en from "@/i18n/locales/en";
import { ROUTES } from "./app";

export type NavIconType = ComponentType<SVGProps<SVGSVGElement>>;
type NavItemKey = Exclude<keyof (typeof en)["nav"], "sections" | "mainNavigation">;
type NavSectionKey = keyof (typeof en)["nav"]["sections"];

export interface NavItem {
  labelKey: NavItemKey;
  path: string;
  icon: NavIconType;
  iconSelected?: NavIconType;
  /** Shows the unread-messages count. */
  hasInboxBadge?: boolean;
}

export interface NavSection {
  titleKey: NavSectionKey;
  isHeaderHidden?: boolean;
  items: NavItem[];
}

/** Single source of truth for the side navigation. */
export const NAV_SECTIONS: NavSection[] = [
  {
    titleKey: "overview",
    isHeaderHidden: true,
    items: [
      {
        labelKey: "dashboard",
        path: ROUTES.dashboard,
        icon: HomeIcon,
        iconSelected: HomeIconSolid,
      },
    ],
  },
  {
    titleKey: "site",
    items: [
      {
        labelKey: "siteSections",
        path: ROUTES.sections,
        icon: RectangleGroupIcon,
        iconSelected: RectangleGroupIconSolid,
      },
      {
        labelKey: "profile",
        path: ROUTES.profile,
        icon: UserCircleIcon,
        iconSelected: UserCircleIconSolid,
      },
      {
        labelKey: "socialLinks",
        path: ROUTES.socialLinks,
        icon: LinkIcon,
        iconSelected: LinkIconSolid,
      },
    ],
  },
  {
    titleKey: "content",
    items: [
      { labelKey: "projects", path: ROUTES.projects, icon: CubeIcon, iconSelected: CubeIconSolid },
      {
        labelKey: "experiences",
        path: ROUTES.experiences,
        icon: BriefcaseIcon,
        iconSelected: BriefcaseIconSolid,
      },
      {
        labelKey: "achievements",
        path: ROUTES.achievements,
        icon: AcademicCapIcon,
        iconSelected: AcademicCapIconSolid,
      },
      {
        labelKey: "activities",
        path: ROUTES.activities,
        icon: HeartIcon,
        iconSelected: HeartIconSolid,
      },
      {
        labelKey: "skills",
        path: ROUTES.skills,
        icon: CommandLineIcon,
        iconSelected: CommandLineIconSolid,
      },
      {
        labelKey: "blog",
        path: ROUTES.blog,
        icon: NewspaperIcon,
        iconSelected: NewspaperIconSolid,
      },
    ],
  },
  {
    titleKey: "library",
    items: [
      { labelKey: "media", path: ROUTES.media, icon: PhotoIcon, iconSelected: PhotoIconSolid },
    ],
  },
  {
    titleKey: "inbox",
    items: [
      {
        labelKey: "messages",
        path: ROUTES.messages,
        icon: ChatBubbleLeftRightIcon,
        iconSelected: ChatBubbleLeftRightIconSolid,
        hasInboxBadge: true,
      },
    ],
  },
  {
    titleKey: "system",
    items: [
      {
        labelKey: "settings",
        path: ROUTES.settings,
        icon: Cog6ToothIcon,
        iconSelected: Cog6ToothIconSolid,
      },
    ],
  },
];
