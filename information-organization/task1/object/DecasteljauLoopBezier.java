package object;

import java.awt.*;
import java.awt.geom.*;
import java.util.ArrayList;
import java.util.List;

import contract.*;

public class DecasteljauLoopBezier implements Bezier {
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
        int degree = controlPoints.size() - 1;

        for (int i = 1; i <= degree; i++) {
            List<Point2D> nextPoints = new ArrayList<Point2D>();
            for (int j = 0; j < controlPoints.size() - 1; j++) {
                double x = controlPoints.get(j).getX() * (1.0 - t) + controlPoints.get(j + 1).getX() * t;
                double y = controlPoints.get(j).getY() * (1.0 - t) + controlPoints.get(j + 1).getY() * t;
                Point2D p = new Point2D.Double(x, y);
                nextPoints.add(p);
            }
            controlPoints = nextPoints;
        }
        return controlPoints.get(0);
    }
}