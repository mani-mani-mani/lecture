package object;

import java.awt.*;
import java.awt.geom.*;
import java.util.ArrayList;
import java.util.List;

import contract.*;

public class DecasteljauRecursiveBezier implements Bezier {
    public List<Point2D> execute(List<Point2D> controlPoints, int numberOfPoints) {
        List<Point2D> result = new ArrayList<Point2D>();
        for (int i = 0; i <= numberOfPoints; i++) {
            double t = (double) i / (double) numberOfPoints;
            result.add(point(controlPoints, t));
        }
        return result;
    }

    // get point recursively
    private Point2D point(List<Point2D> controlPoints, double t) {
        if (controlPoints.size() == 1) {
            return controlPoints.get(0);
        }
        List<Point2D> points = new ArrayList<Point2D>();
        for (int i = 0; i < controlPoints.size() - 1; i++) {
            double x = controlPoints.get(i).getX() * (1.0 - t) + controlPoints.get(i + 1).getX() * t;
            double y = controlPoints.get(i).getY() * (1.0 - t) + controlPoints.get(i + 1).getY() * t;
            Point2D p = new Point2D.Double(x, y);
            points.add(p);
        }
        return point(points, t);
    }
}